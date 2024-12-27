import { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import {ApiClient} from "../common/api-client";
import {Endpoints} from "../common/endpoints";

/**
 * Skip to next song
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.next" })
export class Next extends SingletonAction<NextSettings> {
	override async onKeyDown(ev: KeyDownEvent<NextSettings>): Promise<void> {
		try {
			await ApiClient.post(Endpoints.Next);
		} catch (error) {
			await ev.action.showAlert();
		}
	}
}

/**
 * Settings for {@link Next}.
 */
type NextSettings = {
};