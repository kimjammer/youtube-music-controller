import streamDeck from "@elgato/streamdeck";

export class ApiClient {

	public static async post(endpoint: string): Promise<void> {
		let settings = await streamDeck.settings.getGlobalSettings();
		let response;

		try {
			response = await fetch("http://" + settings.host + ":" + settings.port + endpoint, {
				method: "POST",
				headers: {
					"Authorization": "Bearer " + settings.auth_token as string,
				}
			});
		} catch (error) {
			settings.conn_ok = false;
			await streamDeck.settings.setGlobalSettings(settings);
			streamDeck.logger.error("Failed to fetch ", error);
			throw new Error("Failed to fetch" + error);
		}

		//If connection was previously bad, it is now good
		if (settings.conn_ok === false) {
			settings.conn_ok = true;
			await streamDeck.settings.setGlobalSettings(settings);
		}

		if (response.status === 401) {
			let globalSettings = await streamDeck.settings.getGlobalSettings();
			globalSettings.auth_ok = false;
			await streamDeck.settings.setGlobalSettings(globalSettings);
		}

		if (!response.ok) {
			streamDeck.logger.error("Failed to post to " + endpoint + ": " + response.statusText);
			throw new Error("Failed to post to " + endpoint + ": " + response.statusText);
		}
	}

	public static async get(endpoint: string): Promise<any> {
		let settings = await streamDeck.settings.getGlobalSettings();

		let response;
		try {
			response = await fetch("http://" + settings.host + ":" + settings.port + endpoint, {
				method: "GET",
				headers: {
					"Authorization": "Bearer " + settings.auth_token as string,
				}
			});
		} catch (error) {
			settings.conn_ok = false;
			await streamDeck.settings.setGlobalSettings(settings);
			streamDeck.logger.error("Failed to fetch ", error);
			throw new Error("Failed to fetch" + error);
		}

		//If connection was previously bad, it is now good
		if (settings.conn_ok === false) {
			settings.conn_ok = true;
			await streamDeck.settings.setGlobalSettings(settings);
		}

		if (response.status === 401) {
			let globalSettings = await streamDeck.settings.getGlobalSettings();
			globalSettings.auth_ok = false;
			await streamDeck.settings.setGlobalSettings(globalSettings);
		}

		if (!response.ok) {
			streamDeck.logger.error("Failed to get from " + endpoint + ": " + response.statusText);
			throw new Error("Failed to get from " + endpoint + ": " + response.statusText);
		}

		if (response.status === 204) {
			return 204;
		}

		try {
			return response.json();
		} catch (error) {
			streamDeck.logger.error(error);
			throw new Error("Failed to parse response: " + error);
		}
	}
}