import streamDeck, {
	action,
	DidReceiveSettingsEvent,
	KeyDownEvent,
	SingletonAction,
	WillAppearEvent,
	WillDisappearEvent,
} from "@elgato/streamdeck";
import {ApiClient} from "../common/api-client";
import {Endpoints} from "../common/endpoints";
import {Jimp} from "jimp";

/**
 * Display info about current song
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.song-info" })
export class SongInfo extends SingletonAction<SongInfoSettings> {
	private pollingInterval: NodeJS.Timeout | undefined;
	private crrImageURL: string = "";
	private title: string = "";
	private artist: string = "";
	private album: string = "";

	private instances: Instance[] = [];

	override async onWillAppear(ev: WillAppearEvent<SongInfoSettings>): Promise<void> {
		//If this is the first instance, start polling the API
		if (this.instances.length === 0) {
			this.pollingInterval = setInterval(this.updateSongInfo.bind(this), 500);
		}

		//Add current instance to list
		let instance: Instance = {
			ev: ev,
			scrollingInterval: setInterval(this.updateTitle.bind(this), 1000/ev.payload.settings.scrollSpeed, ev),
			scrollIndices: [0, 0, 0],
		}
		this.instances.push(instance);

		//Initialize empty settings to default values
		if (!ev.payload.settings.shownText) {
			let newSettings = ev.payload.settings;
			newSettings.shownText = [];
			await ev.action.setSettings(newSettings);
		}
		if (!ev.payload.settings.scrollSpeed ||
			ev.payload.settings.scrollSpeed < 1 ||
			ev.payload.settings.scrollSpeed > 10) {
			let newSettings = ev.payload.settings;
			newSettings.scrollSpeed = 5;
			await ev.action.setSettings(newSettings);
		}
		if (!ev.payload.settings.quadrant) {
			let newSettings = ev.payload.settings;
			newSettings.quadrant = "full";
			await ev.action.setSettings(newSettings);
		}
		if (!ev.payload.settings.gapComp) {
			let newSettings = ev.payload.settings;
			newSettings.gapComp = true;
			await ev.action.setSettings(newSettings);
		}
	}

	override onWillDisappear(ev: WillDisappearEvent<SongInfoSettings>): void {
		let instance = this.findInstance(ev);
		let instanceIndex = this.findInstanceIndex(ev);

		if (!instance || instanceIndex == null) return;

		//Remove instance from list
		this.instances.splice(instanceIndex, 1);

		clearInterval(instance.scrollingInterval);
		instance.scrollingInterval = undefined;

		//If no instances left, stop polling
		if (this.instances.length === 0) {
			clearInterval(this.pollingInterval);
			this.pollingInterval = undefined;
		}
	}

	override async onKeyDown(ev: KeyDownEvent<SongInfoSettings>): Promise<void> {
		try {
			await ApiClient.post(Endpoints.TogglePlay);
		} catch (error) {
			await ev.action.showAlert();
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<SongInfoSettings>): Promise<void> {
		//Find instance
		let instance = this.findInstance(ev);

		if (!instance) {
			return;
		}

		//Update settings
		instance.ev.payload.settings = ev.payload.settings;

		clearInterval(instance.scrollingInterval);
		instance.scrollingInterval = setInterval(this.updateTitle.bind(this), 1000/instance.ev.payload.settings.scrollSpeed, ev);
		await this.updateImage(ev);
	}

	private async updateSongInfo(): Promise<void> {
		let song: Song;
		try {
			let response = await ApiClient.get(Endpoints.Song);
			if (response === 204) {
				this.title = "";
				this.artist = "";
				this.album = "";
				for (let instance of this.instances) {
					await instance.ev.action.setImage("imgs/plugin/category-icon");
				}
			}
			song = response as Song;
		} catch (error) {
			//Only show alert if connection is good and authorized (ie, something unexpected has happened)
			//Otherwise, status will be shown on pause play button
			const globalSettings = await streamDeck.settings.getGlobalSettings();
			if (globalSettings.conn_ok === true && globalSettings.auth_ok === true) {
				for (let instance of this.instances) {
					await instance.ev.action.showAlert();
				}
			}

			this.title = "";
			this.artist = "";
			this.album = "";
			for (let instance of this.instances) {
				await instance.ev.action.setImage("imgs/plugin/category-icon");
			}
			return;
		}

		//Check if song has changed
		if (song.imageSrc === this.crrImageURL) return;

		this.crrImageURL = song.imageSrc;
		this.title = song.title;
		this.artist = song.artist;
		this.album = song.album;
		for (let instance of this.instances) {
			await this.updateImage(instance.ev);
		}
	}

	private async updateImage(ev: WillAppearEvent<SongInfoSettings> | DidReceiveSettingsEvent<SongInfoSettings>) {
		let gap = ev.payload.settings.gapComp ? 32: 0;
		let albumImage = await Jimp.read(this.crrImageURL);
		let processed = albumImage.scaleToFit({w: 288+gap, h:288+gap});

		//Crop image to quadrant
		if (ev.payload.settings.quadrant == "tl") {
			processed = albumImage.crop({x: 0, y: 0, w: albumImage.width/2 - gap/2, h: albumImage.height/2 - gap/2});
		} else if (ev.payload.settings.quadrant == "tr") {
			processed = albumImage.crop({x: albumImage.width/2 + gap/2, y: 0, w: albumImage.width/2 - gap/2, h: albumImage.height/2 - gap/2});
		} else if (ev.payload.settings.quadrant == "bl") {
			processed = albumImage.crop({x: 0, y: albumImage.height/2 + gap/2, w: albumImage.width/2 - gap/2, h: albumImage.height/2 - gap/2});
		} else if (ev.payload.settings.quadrant == "br") {
			processed = albumImage.crop({x: albumImage.width/2 + gap/2, y: albumImage.height/2 + gap/2, w: albumImage.width/2 - gap/2, h: albumImage.height/2 - gap/2});
		} else {
			processed = albumImage.crop({x: 0, y: 0, w: albumImage.width, h: albumImage.height});
		}

		await ev.action.setImage(await processed.getBase64("image/png"));
	}

	//Scroll position of title, artist, album
	private async updateTitle(ev: WillAppearEvent<SongInfoSettings> | DidReceiveSettingsEvent<SongInfoSettings>): Promise<void> {
		let instance = this.findInstance(ev);
		if (!instance) return;

		let text = "";
		let numShown = 0;
		if (ev.payload.settings.shownText.includes("title")) {
			text += this.transformText(this.title, 0, instance);
			numShown++;
		}
		if (ev.payload.settings.shownText.includes("artist")) {
			if (numShown > 0) {
				text += "\n";
			}
			text += this.transformText(this.artist, 1, instance);
		}
		if (ev.payload.settings.shownText.includes("album")) {
			if (numShown > 0) {
				text += "\n";
			}
			text += this.transformText(this.album, 2, instance);
		}
		await ev.action.setTitle(text);
	}

	public transformText(text: string | undefined, indexId: number, instance: Instance): string {
		if (typeof text != "string") return "";

		let output = "";
		//Check if title needs to be scrolled
		if (text.length < 6) {
			return text;
		}

		//Get substring and pad
		if (instance.scrollIndices[indexId] < text.length) {
			output = text.substring(instance.scrollIndices[indexId], instance.scrollIndices[indexId] + 6).padEnd(6, " ");
		} else {
			output = text.substring(0, instance.scrollIndices[indexId] - text.length).padStart(6, " ");
		}

		//Increment index
		if (instance.scrollIndices[indexId] >= text.length + 5) {
			instance.scrollIndices[indexId] = 0;
		} else {
			instance.scrollIndices[indexId]++;
		}

		return output;
	}

	private findInstance(ev: WillAppearEvent<SongInfoSettings> | WillDisappearEvent<SongInfoSettings> | DidReceiveSettingsEvent<SongInfoSettings>){
		//Assert we are not in multi action
		if (ev.payload.isInMultiAction) return;

		//Find coordinates
		let col = ev.payload.coordinates.column;
		let row = ev.payload.coordinates.row;

		//Find instance
		return this.instances.find((instance) => {
			return !instance.ev.payload.isInMultiAction &&
				instance.ev.payload.coordinates.column === col &&
				instance.ev.payload.coordinates.row === row;
		})
	}

	private findInstanceIndex(ev: WillAppearEvent<SongInfoSettings> | WillDisappearEvent<SongInfoSettings> | DidReceiveSettingsEvent<SongInfoSettings>){
		//Assert we are not in multi action
		if (ev.payload.isInMultiAction) return;

		//Find coordinates
		let col = ev.payload.coordinates.column;
		let row = ev.payload.coordinates.row;

		//Find instance
		return this.instances.findIndex((instance) => {
			return !instance.ev.payload.isInMultiAction &&
				instance.ev.payload.coordinates.column === col &&
				instance.ev.payload.coordinates.row === row;
		})
	}
}

/**
 * Settings for {@link SongInfo}.
 */
type SongInfoSettings = {
	shownText: string[];
	scrollSpeed: number;
	quadrant: string;
	gapComp: boolean;
};

type Song = {
	title: string;
	artist: string;
	views: number;
	uploadDate: string;
	imageSrc: string;
	isPaused: boolean;
	songDuration: number;
	elapsedSeconds: number;
	url: string;
	album: string;
	videoId: string;
	playlistId: string;
	mediaType: "AUDIO" | "ORIGINAL_MUSIC_VIDEO" | "USER_GENERATED_CONTENT" | "PODCAST_EPISODE" | "OTHER_VIDEO";
}

type Instance = {
	ev: WillAppearEvent<SongInfoSettings>;
	scrollingInterval: NodeJS.Timeout | undefined;
	scrollIndices: number[];
}