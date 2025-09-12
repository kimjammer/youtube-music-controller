import {action, KeyDownEvent, SingletonAction, WillAppearEvent} from "@elgato/streamdeck";
import {ApiClient} from "../common/api-client";
import {Endpoints} from "../common/endpoints";
import {WsClient} from "../common/ws-client";
import {DataTypes, PlayerInfoData, VolumeChangedData} from "../common/api-types";

type VolumeResponse = {
	state: number,
	isMuted: boolean
}

/**
 * Toggles mute
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.toggle-mute" })
export class ToggleMute extends SingletonAction<ToggleMuteSettings> {
	private instances: Instance[] = [];

	constructor(wsClient: WsClient) {
		super();
		wsClient.subscribe(DataTypes.PlayerInfo, this.onPlayerInfo.bind(this));
		wsClient.subscribe(DataTypes.VolumeChanged, this.onVolumeChanged.bind(this));
	}

	override async onWillAppear(ev: WillAppearEvent<ToggleMuteSettings>): Promise<void> {
		//Add current instance to list
		let instance: Instance = {
			ev: ev,
		}
		this.instances.push(instance);

		let volumeStatus: VolumeResponse = await ApiClient.get(Endpoints.Volume);
		await this.updateImage(volumeStatus.isMuted);
	}

	override async onKeyDown(ev: KeyDownEvent<ToggleMuteSettings>): Promise<void> {
		try {
			await ApiClient.post(Endpoints.ToggleMute);
		} catch (error) {
			await ev.action.showAlert();
		}
	}

	private async onPlayerInfo(data: PlayerInfoData): Promise<void> {
		await this.updateImage(data.muted);
	}

	private async onVolumeChanged(data: VolumeChangedData): Promise<void> {
		await this.updateImage(data.muted);
	}

	private async updateImage(state: boolean) {
		for (let instance of this.instances) {
			if (state) {
				await instance.ev.action.setImage("imgs/actions/volume-mute/volume-mute");
			} else {
				await instance.ev.action.setImage("imgs/actions/volume-unmute/volume-unmute");
			}
		}
	}
}

/**
 * Settings for {@link ToggleMute}.
 */
type ToggleMuteSettings = {
};

type Instance = {
	ev: WillAppearEvent<ToggleMuteSettings>;
}