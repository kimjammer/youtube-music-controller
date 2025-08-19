import { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import {ApiClient} from "../common/api-client";
import {Endpoints} from "../common/endpoints";

/**
 * Repeat Song
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.repeat" })
export class Repeat extends SingletonAction<RepeatSettings> {
	override async onKeyDown(ev: KeyDownEvent<RepeatSettings>): Promise<void> {
		try {
			await ApiClient.post(Endpoints.Repeat);
		} catch (error) {
			await ev.action.showAlert();
		}
	}
}

/**
 * Settings for {@link Repeat}.
 */
type RepeatSettings = {
};