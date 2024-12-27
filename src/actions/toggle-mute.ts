import { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import {ApiClient} from "../common/api-client";
import {Endpoints} from "../common/endpoints";

/**
 * Toggles mute
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.toggle-mute" })
export class ToggleMute extends SingletonAction<ToggleMuteSettings> {
	override async onKeyDown(ev: KeyDownEvent<ToggleMuteSettings>): Promise<void> {
		try {
			await ApiClient.post(Endpoints.ToggleMute);
		} catch (error) {
			await ev.action.showAlert();
		}
	}
}

/**
 * Settings for {@link ToggleMute}.
 */
type ToggleMuteSettings = {
};