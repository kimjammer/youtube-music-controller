import {action, KeyDownEvent, SingletonAction, WillAppearEvent, streamDeck, WillDisappearEvent} from "@elgato/streamdeck";
import {ApiClient} from "../common/api-client";
import {Endpoints} from "../common/endpoints";
import {GlobalSettings} from "../common/types";
import {WsClient} from "../common/ws-client";
import {DataTypes, PlayerInfoData, PlayerStateChangedData, SongInfo, VideoChangedData} from "../common/api-types";
import {findInstance, findInstanceIndex} from "../common/utils";


/**
 * Toggle between playing/pausing the current song
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.toggle-play" })
export class TogglePlay extends SingletonAction<TogglePlaySettings> {
	private instances: Instance[] = [];

	constructor(wsClient: WsClient) {
		super();
		wsClient.subscribe(DataTypes.PlayerInfo, this.onPlayerInfo.bind(this));
		wsClient.subscribe(DataTypes.PlayerStateChanged, this.onPlayerStateChanged.bind(this));
		wsClient.subscribe(DataTypes.VideoChanged, this.onVideoChanged.bind(this));
	}

	override async onWillAppear(ev: WillAppearEvent<TogglePlaySettings>): Promise<void> {
		//Add current instance to list
		let instance: Instance = {
			ev: ev,
		}
		this.instances.push(instance);

		//Check the settings
		let settings: GlobalSettings = await streamDeck.settings.getGlobalSettings<GlobalSettings>();

		//Set Defaults if not set
		let settingsChanged = false;
		if (!settings.host) {
			settings.host = "127.0.0.1";
			settingsChanged = true;
		}
		if (!settings.port) {
			settings.port = 26538;
			settingsChanged = true;
		}
		if (!settings.auth_token) {
			settings.auth_token = "";
			settingsChanged = true;
		}
		if (!settings.auth_ok) {
			settings.auth_ok = false;
			settingsChanged = true;
			if (ev.action.isKey()) {
				await ev.action.setTitle("Please\nAuthorize")
			}
		}
		if (settingsChanged) {
			await streamDeck.settings.setGlobalSettings(settings);
		}

		//Listen for changes to global settings (specifically auth_ok)
		streamDeck.settings.onDidReceiveGlobalSettings<GlobalSettings>(async (event) => {
			if (ev.action.isKey()) {
				if (!event.settings.auth_ok) {
					await ev.action.setTitle("Please\nAuthorize")
				} else {
					await ev.action.setTitle("");
				}
			}
		})

		let songInfo: SongInfo = await ApiClient.get(Endpoints.Song);
		await this.updateImage(!songInfo.isPaused);
	}

	override onWillDisappear(ev: WillDisappearEvent<TogglePlaySettings>): void {
		let instance = findInstance(this.instances, ev) as Instance;
		let instanceIndex = findInstanceIndex(this.instances, ev);

		if (!instance || instanceIndex == null) return;

		//Remove instance from list
		this.instances.splice(instanceIndex, 1);
	}

	override async onKeyDown(ev: KeyDownEvent<TogglePlaySettings>): Promise<void> {
		try {
			await ApiClient.post(Endpoints.TogglePlay);
		} catch (error) {
			await ev.action.showAlert();

		}
	}

	private async onPlayerInfo(data: PlayerInfoData): Promise<void> {
		await this.updateImage(data.isPlaying);
	}

	private async onPlayerStateChanged(data: PlayerStateChangedData): Promise<void> {
		await this.updateImage(data.isPlaying);
	}

	private async onVideoChanged(data: VideoChangedData): Promise<void> {
		if (!data.song) return;

		if (data.song.isPaused === false) {
			await this.updateImage(true);
			return;
		}

		try {
			const song: SongInfo = await ApiClient.get(Endpoints.Song);
			await this.updateImage(!song.isPaused);
		} catch {
			await this.updateImage(true);
		}
	}

	private async updateImage(isPlaying: boolean) {
		for (let instance of this.instances) {
			if (!instance.ev.action.isKey()) continue;
			if (isPlaying) {
				await instance.ev.action.setImage("imgs/actions/toggle-play/pause");
			} else {
				await instance.ev.action.setImage("imgs/actions/toggle-play/play");
			}
		}
	}
}

/**
 * Settings for {@link TogglePlay}.
 */
type TogglePlaySettings = {
};

type Instance = {
	ev: WillAppearEvent<TogglePlaySettings>;
}