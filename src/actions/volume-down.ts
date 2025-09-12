import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import {ApiClient} from "../common/api-client";
import {Endpoints} from "../common/endpoints";

type VolumeResponse = {
	state: number,
	isMuted: boolean
}

/**
 * Decrease the volume
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.volume-down" })
export class VolumeDown extends SingletonAction<VolumeDownSettings> {
	override async onKeyDown(ev: KeyDownEvent<VolumeDownSettings>): Promise<void> {
		try {
			let volumeStatus: VolumeResponse = await ApiClient.get(Endpoints.Volume);
			await ApiClient.post(Endpoints.Volume, { volume: volumeStatus.state - 5 });
		} catch (error) {
			await ev.action.showAlert();
		}
	}
}

/**
 * Settings for {@link VolumeDown}.
 */
type VolumeDownSettings = {
};