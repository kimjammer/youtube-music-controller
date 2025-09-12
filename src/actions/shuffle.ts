import {action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent} from "@elgato/streamdeck";
import {ApiClient} from "../common/api-client";
import {Endpoints} from "../common/endpoints";
import {WsClient} from "../common/ws-client";
import {DataTypes, PlayerInfoData, ShuffleChangedData} from "../common/api-types";
import {findInstance, findInstanceIndex} from "../common/utils";

type ShuffleResponse = {
	state: boolean;
}

/**
 * Shuffle queue
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.shuffle" })
export class Shuffle extends SingletonAction<ShuffleSettings> {
	private instances: Instance[] = [];

	constructor(wsClient: WsClient) {
		super();
		wsClient.subscribe(DataTypes.PlayerInfo, this.onPlayerInfo.bind(this));
		wsClient.subscribe(DataTypes.ShuffleChanged, this.onShuffleChanged.bind(this));
	}

	override async onWillAppear(ev: WillAppearEvent<ShuffleSettings>): Promise<void> {
		//Add current instance to list
		let instance: Instance = {
			ev: ev,
		}
		this.instances.push(instance);

		let shuffleMode: ShuffleResponse = await ApiClient.get(Endpoints.Shuffle);
		await this.updateImage(shuffleMode.state);
	}

	override onWillDisappear(ev: WillDisappearEvent<ShuffleSettings>): void {
		let instance = findInstance(this.instances, ev) as Instance;
		let instanceIndex = findInstanceIndex(this.instances, ev);

		if (!instance || instanceIndex == null) return;

		//Remove instance from list
		this.instances.splice(instanceIndex, 1);
	}

	override async onKeyDown(ev: KeyDownEvent<ShuffleSettings>): Promise<void> {
		try {
			await ApiClient.post(Endpoints.Shuffle);
		} catch (error) {
			await ev.action.showAlert();
		}
	}

	private async onPlayerInfo(data: PlayerInfoData): Promise<void> {
		await this.updateImage(data.shuffle);
	}

	private async onShuffleChanged(data: ShuffleChangedData): Promise<void> {
		await this.updateImage(data.shuffle);
	}

	private async updateImage(state: boolean) {
		for (let instance of this.instances) {
			if (state) {
				await instance.ev.action.setImage("imgs/actions/shuffle/shuffle");
			} else {
				await instance.ev.action.setImage("imgs/actions/shuffle/shuffle-off");
			}
		}
	}
}

/**
 * Settings for {@link Shuffle}.
 */
type ShuffleSettings = {
};

type Instance = {
	ev: WillAppearEvent<ShuffleSettings>;
}