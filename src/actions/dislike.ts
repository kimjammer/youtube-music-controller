import { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import {ApiClient} from "../common/api-client";
import {Endpoints} from "../common/endpoints";

/**
 * Dislike the current song
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.dislike" })
export class Dislike extends SingletonAction<dislikeSettings> {
	override async onKeyDown(ev: KeyDownEvent<dislikeSettings>): Promise<void> {
		try {
			await ApiClient.post(Endpoints.Dislike);
		} catch (error) {
			await ev.action.showAlert();
		}
	}
}

/**
 * Settings for {@link dislike}.
 */
type dislikeSettings = {
};