import { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import {ApiClient} from "../common/api-client";
import {Endpoints} from "../common/endpoints";

/**
 * Shuffle queue
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.shuffle" })
export class Shuffle extends SingletonAction<ShuffleSettings> {
	override async onKeyDown(ev: KeyDownEvent<ShuffleSettings>): Promise<void> {
		try {
			await ApiClient.post(Endpoints.Shuffle);
		} catch (error) {
			await ev.action.showAlert();
		}
	}
}

/**
 * Settings for {@link Shuffle}.
 */
type ShuffleSettings = {
};