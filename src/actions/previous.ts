import { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import {ApiClient} from "../common/api-client";
import {Endpoints} from "../common/endpoints";

/**
 * Goes back to previous song
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.previous" })
export class Previous extends SingletonAction<PreviousSettings> {
	override async onKeyDown(ev: KeyDownEvent<PreviousSettings>): Promise<void> {
		try {
			await ApiClient.post(Endpoints.Previous);
		} catch (error) {
			await ev.action.showAlert();
		}
	}
}

/**
 * Settings for {@link Previous}.
 */
type PreviousSettings = {
};