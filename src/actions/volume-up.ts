import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import {ApiClient} from "../common/api-client";
import {Endpoints} from "../common/endpoints";

type VolumeResponse = {
	state: number,
	isMuted: boolean
}

/**
 * Increase the volume
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.volume-up" })
export class VolumeUp extends SingletonAction<VolumeUpSettings> {
	override async onKeyDown(ev: KeyDownEvent<VolumeUpSettings>): Promise<void> {
		try {
			let volumeStatus: VolumeResponse = await ApiClient.get(Endpoints.Volume);
			await ApiClient.post(Endpoints.Volume, { volume: volumeStatus.state + 5 });
		} catch (error) {
			await ev.action.showAlert();
		}
	}
}

/**
 * Settings for {@link VolumeUp}.
 */
type VolumeUpSettings = {
};