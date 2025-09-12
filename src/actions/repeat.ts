import {action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent} from "@elgato/streamdeck";
import {ApiClient} from "../common/api-client";
import {Endpoints} from "../common/endpoints";
import {WsClient} from "../common/ws-client";
import {DataTypes, PlayerInfoData, RepeatChangedData} from "../common/api-types";
import {findInstance, findInstanceIndex} from "../common/utils";

type RepeatResponse = {
	"mode": string;
}

/**
 * Repeat Song
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.repeat" })
export class Repeat extends SingletonAction<RepeatSettings> {
	private instances: Instance[] = [];

	constructor(wsClient: WsClient) {
		super();
		wsClient.subscribe(DataTypes.PlayerInfo, this.onPlayerInfo.bind(this));
		wsClient.subscribe(DataTypes.RepeatChanged, this.onRepeatChanged.bind(this));
	}

	override async onWillAppear(ev: WillAppearEvent<RepeatSettings>): Promise<void> {
		//Add current instance to list
		let instance: Instance = {
			ev: ev,
		}
		this.instances.push(instance);

		let repeatMode: RepeatResponse = await ApiClient.get(Endpoints.RepeatMode);
		await this.updateImage(repeatMode.mode);
	}

	override onWillDisappear(ev: WillDisappearEvent<RepeatSettings>): void {
		let instance = findInstance(this.instances, ev) as Instance;
		let instanceIndex = findInstanceIndex(this.instances, ev);

		if (!instance || instanceIndex == null) return;

		//Remove instance from list
		this.instances.splice(instanceIndex, 1);
	}

	override async onKeyDown(ev: KeyDownEvent<RepeatSettings>): Promise<void> {
		try {
			await ApiClient.post(Endpoints.Repeat, { "iteration": 1});
		} catch (error) {
			await ev.action.showAlert();
		}
	}

	private async onPlayerInfo(data: PlayerInfoData): Promise<void> {
		await this.updateImage(data.repeat)
	}

	private async onRepeatChanged(data: RepeatChangedData): Promise<void> {
		await this.updateImage(data.repeat)
	}

	private async updateImage(mode: string) {
		for (let instance of this.instances) {
			if (mode === "NONE") {
				await instance.ev.action.setImage("imgs/actions/repeat/repeat-off");
			} else if (mode === "ONE") {
				await instance.ev.action.setImage("imgs/actions/repeat/repeat-one");
			} else {
				await instance.ev.action.setImage("imgs/actions/repeat/repeat");
			}
		}
	}
}

/**
 * Settings for {@link Repeat}.
 */
type RepeatSettings = {
};

type Instance = {
	ev: WillAppearEvent<RepeatSettings>;
}