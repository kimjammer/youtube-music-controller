import { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import {ApiClient} from "../common/api-client";
import {Endpoints} from "../common/endpoints";
import { logger } from "../plugin";

/**
 * Like the current song
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.like" })
export class Like extends SingletonAction<likeSettings> {
	override async onKeyDown(ev: KeyDownEvent<likeSettings>): Promise<void> {
		try {
			await ApiClient.post(Endpoints.Like);
		} catch (error) {
			logger.error(error);
			await ev.action.showAlert();
		}
	}
}

/**
 * Settings for {@link like}.
 */
type likeSettings = {
};