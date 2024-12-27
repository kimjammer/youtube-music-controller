import { action, KeyDownEvent, SingletonAction, WillAppearEvent, streamDeck } from "@elgato/streamdeck";
import {ApiClient} from "../common/api-client";
import {Endpoints} from "../common/endpoints";

type GlobalSettings = {
	host: string;
	port: number;
	auth_token: string;
	auth_ok: boolean;
	conn_ok: boolean;
}

/**
 * Toggle between playing/pausing the current song
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.toggle-play" })
export class TogglePlay extends SingletonAction<TogglePlaySettings> {

	override async onWillAppear(ev: WillAppearEvent<TogglePlaySettings>): Promise<void> {
		//Check the settings
		let settings: GlobalSettings = await streamDeck.settings.getGlobalSettings();

		//Set Defaults if not set
		let settingsChanged = false;
		if (!settings.host) {
			settings.host = "127.0.0.1";
			settingsChanged = true;
		}
		if (!settings.port) {
			settings.port = 26538;
			settingsChanged = true;
		}
		if (!settings.auth_token) {
			settings.auth_token = "";
			settingsChanged = true;
		}
		if (!settings.auth_ok) {
			settings.auth_ok = false;
			settingsChanged = true;
			await ev.action.setTitle("Please\nAuthorize")
		}
		if (settingsChanged) {
			await streamDeck.settings.setGlobalSettings(settings);
		}

		//Listen for changes to global settings (specifically auth_ok)
		streamDeck.settings.onDidReceiveGlobalSettings(async (event) => {
			if (!event.settings.auth_ok) {
				await ev.action.setTitle("Please\nAuthorize")
			} else {
				await ev.action.setTitle("");
			}
		})
	}

	override async onKeyDown(ev: KeyDownEvent<TogglePlaySettings>): Promise<void> {
		try {
			await ApiClient.post(Endpoints.TogglePlay);
		} catch (error) {
			await ev.action.showAlert();

		}
	}
}

/**
 * Settings for {@link TogglePlay}.
 */
type TogglePlaySettings = {
};