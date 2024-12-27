import streamDeck, {
	action,
	SingletonAction,
	WillAppearEvent,
	WillDisappearEvent,
	KeyDownEvent,
	DidReceiveSettingsEvent, KeyAction,
} from "@elgato/streamdeck";
import {ApiClient} from "../common/api-client";
import {Endpoints} from "../common/endpoints";

/**
 * Display info about current song
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.song-info" })
export class SongInfo extends SingletonAction<SongInfoSettings> {
	private pollingInterval: NodeJS.Timeout | undefined;
	private scrollingInterval: NodeJS.Timeout | undefined;
	private crrImageURL: string = "";
	private title: string = "";
	private artist: string = "";
	private album: string = "";
	private settings: SongInfoSettings | undefined;

	override async onWillAppear(ev: WillAppearEvent<SongInfoSettings>): Promise<void> {
		this.settings = ev.payload.settings;
		this.pollingInterval = setInterval(this.updateSongInfo.bind(this), 500, ev);
		this.scrollingInterval = setInterval(this.updateTitle.bind(this), 1000/this.settings.scrollSpeed, ev);

		if (!ev.payload.settings.shownText) {
			this.settings.shownText = [];
			await ev.action.setSettings(this.settings);
		}
		if (!ev.payload.settings.scrollSpeed ||
			ev.payload.settings.scrollSpeed < 1 ||
			ev.payload.settings.scrollSpeed > 10) {
			this.settings.scrollSpeed = 5;
			await ev.action.setSettings(this.settings);
		}
	}

	override onWillDisappear(ev: WillDisappearEvent<SongInfoSettings>): void {
		clearInterval(this.pollingInterval);
		clearInterval(this.scrollingInterval)
		this.pollingInterval = undefined;
		this.scrollingInterval = undefined;
	}

	override async onKeyDown(ev: KeyDownEvent<SongInfoSettings>): Promise<void> {
		try {
			await ApiClient.post(Endpoints.TogglePlay);
		} catch (error) {
			await ev.action.showAlert();
		}
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<SongInfoSettings>): void {
		this.settings = ev.payload.settings;

		clearInterval(this.scrollingInterval);
		this.scrollingInterval = setInterval(this.updateTitle.bind(this), 1000/this.settings.scrollSpeed, ev);
	}

	private async updateSongInfo(ev: WillAppearEvent<SongInfoSettings>): Promise<void> {
		let song: Song;
		try {
			let response = await ApiClient.get(Endpoints.Song);
			if (response === 204) {
				this.title = "";
				this.artist = "";
				this.album = "";
				await ev.action.setImage("imgs/plugin/category-icon");
			}
			song = response as Song;
		} catch (error) {
			//Only show alert if connection is good and authorized (ie, something unexpected has happened)
			//Otherwise, status will be shown on pause play button
			const globalSettings = await streamDeck.settings.getGlobalSettings();
			if (globalSettings.conn_ok === true && globalSettings.auth_ok === true) {
				await ev.action.showAlert();
			}
			return;
		}

		//Check if song has changed
		if (song.imageSrc === this.crrImageURL) return;

		this.crrImageURL = song.imageSrc;
		this.title = song.title;
		this.artist = song.artist;
		this.album = song.album;

		let imgResponse = await fetch(song.imageSrc);
		let blob = await imgResponse.blob();
		let buffer = Buffer.from(await blob.arrayBuffer());
		let uri = "data:" + blob.type + ';base64,' + buffer.toString('base64');
		await ev.action.setImage(uri);
	}

	//Scroll position of title, artist, album
	private scrollIndices = [0, 0, 0]
	private async updateTitle(ev: WillAppearEvent<SongInfoSettings> | DidReceiveSettingsEvent<SongInfoSettings>): Promise<void> {
		let text = "";
		let numShown = 0;
		if (this.settings?.shownText.includes("title")) {
			text += this.transformText(this.title, 0);
			numShown++;
		}
		if (this.settings?.shownText.includes("artist")) {
			if (numShown > 0) {
				text += "\n";
			}
			text += this.transformText(this.artist, 1);
		}
		if (this.settings?.shownText.includes("album")) {
			if (numShown > 0) {
				text += "\n";
			}
			text += this.transformText(this.album, 2);
		}
		await ev.action.setTitle(text);
	}

	public transformText(text: string | undefined, indexId: number): string {
		if (typeof text != "string") return "";

		let output = "";
		//Check if title needs to be scrolled
		if (text.length < 6) {
			return text;
		}

		//Get substring and pad
		if (this.scrollIndices[indexId] < text.length) {
			output = text.substring(this.scrollIndices[indexId], this.scrollIndices[indexId] + 6).padEnd(6, " ");
		} else {
			output = text.substring(0, this.scrollIndices[indexId] - text.length).padStart(6, " ");
		}

		//Increment index
		if (this.scrollIndices[indexId] >= text.length + 5) {
			this.scrollIndices[indexId] = 0;
		} else {
			this.scrollIndices[indexId]++;
		}

		return output;
	}
}

/**
 * Settings for {@link SongInfo}.
 */
type SongInfoSettings = {
	shownText: string[];
	scrollSpeed: number;
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