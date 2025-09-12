import WebSocket from "ws";
import streamDeck from "@elgato/streamdeck";
import {Endpoints} from "./endpoints";
import {
	DataTypes,
	PlayerInfoData,
	PlayerStateChangedData,
	PositionChangedData,
	RepeatChangedData,
	ShuffleChangedData,
	VideoChangedData,
	VolumeChangedData
} from "./api-types";
import {GlobalSettings} from "./types";

export class WsClient {
	socket: WebSocket | null = null;
	prevHost: string = "";
	prevPort: number = 0;

	playerInfoSubscribers: {(data: any): void;} [] = [];
	videoChangedSubscribers: {(data: any): void;} [] = [];
	playerStateChangedSubscribers: {(data: any): void;} [] = [];
	positionChangedSubscribers: {(data: any): void;} [] = []
	volumeChangedSubscribers: {(data: any): void;} [] = []
	repeatChangedSubscribers: {(data: any): void;} [] = []
	shuffleChangedSubscribers: {(data: any): void;} [] = []

	constructor() {
		//Listen for changes to global settings
		streamDeck.settings.onDidReceiveGlobalSettings(async (event) => {
			let settings = await streamDeck.settings.getGlobalSettings();
			//If auth_ok is true and host or port changed, reconnect
			if (settings.auth_ok === true && (settings.host !== this.prevHost || settings.port !== this.prevPort)) {
				this.disconnect();
				await this.connect();
			}
		})
	}

	public async connect(): Promise<void> {
		let settings: GlobalSettings = await streamDeck.settings.getGlobalSettings();
		this.prevHost = settings.host;
		this.prevPort = settings.port;

		this.socket = new WebSocket('http://' + settings.host + ":" + settings.port + Endpoints.Ws);

		this.socket.on('error', (m) => streamDeck.logger.error(m));

		this.socket.on('open', function open() {
			streamDeck.logger.debug("Ws connected");
		});

		this.socket.on('disconnect', () => {
			streamDeck.logger.debug("Ws disconnected");
			this.socket = null;
		});

		this.socket.on('message', (data) => {
			let dataObj = JSON.parse(data.toString());
			streamDeck.logger.debug("Received message", dataObj);
			switch (dataObj.type) {
				case DataTypes.PlayerInfo:
					this.playerInfoSubscribers.forEach(sub => sub(dataObj as PlayerInfoData));
					break;
				case DataTypes.VideoChanged:
					this.videoChangedSubscribers.forEach(sub => sub(dataObj as VideoChangedData));
					break;
				case DataTypes.PlayerStateChanged:
					this.playerStateChangedSubscribers.forEach(sub => sub(dataObj as PlayerStateChangedData));
					break;
				case DataTypes.PositionChanged:
					this.positionChangedSubscribers.forEach(sub => sub(dataObj as PositionChangedData));
					break;
				case DataTypes.VolumeChanged:
					this.volumeChangedSubscribers.forEach(sub => sub(dataObj as VolumeChangedData));
					break;
				case DataTypes.RepeatChanged:
					this.repeatChangedSubscribers.forEach(sub => sub(dataObj as RepeatChangedData));
					break;
				case DataTypes.ShuffleChanged:
					this.shuffleChangedSubscribers.forEach(sub => sub(dataObj as ShuffleChangedData));
					break;
			}
		});

	}

	public disconnect(): void {
		if (this.socket) {
			try {
				this.socket.close();
			} catch (e) {
				streamDeck.logger.error("Error closing ws", e);
			} finally {
				this.socket = null;
			}
		}
	}

	public subscribe(dataType: DataTypes, callback: (data: any) => void): void {
		switch (dataType) {
			case DataTypes.PlayerInfo:
				this.playerInfoSubscribers.push(callback);
				break;
			case DataTypes.VideoChanged:
				this.videoChangedSubscribers.push(callback);
				break;
			case DataTypes.PlayerStateChanged:
				this.playerStateChangedSubscribers.push(callback);
				break;
			case DataTypes.PositionChanged:
				this.positionChangedSubscribers.push(callback);
				break;
			case DataTypes.VolumeChanged:
				this.volumeChangedSubscribers.push(callback);
				break;
			case DataTypes.RepeatChanged:
				this.repeatChangedSubscribers.push(callback);
				break;
			case DataTypes.ShuffleChanged:
				this.shuffleChangedSubscribers.push(callback);
				break;
		}
	}

	public unsubscribe(dataType: DataTypes, callback: (data: any) => void): void {
		switch (dataType) {
			case DataTypes.PlayerInfo:
				this.playerInfoSubscribers = this.playerInfoSubscribers.filter(sub => sub !== callback);
				break;
			case DataTypes.VideoChanged:
				this.videoChangedSubscribers = this.videoChangedSubscribers.filter(sub => sub !== callback);
				break;
			case DataTypes.PlayerStateChanged:
				this.playerStateChangedSubscribers = this.playerStateChangedSubscribers.filter(sub => sub !== callback);
				break;
			case DataTypes.PositionChanged:
				this.positionChangedSubscribers = this.positionChangedSubscribers.filter(sub => sub !== callback);
				break;
			case DataTypes.VolumeChanged:
				this.volumeChangedSubscribers = this.volumeChangedSubscribers.filter(sub => sub !== callback);
				break;
			case DataTypes.RepeatChanged:
				this.repeatChangedSubscribers = this.repeatChangedSubscribers.filter(sub => sub !== callback);
				break;
			case DataTypes.ShuffleChanged:
				this.shuffleChangedSubscribers = this.shuffleChangedSubscribers.filter(sub => sub !== callback);
				break;
		}
	}
}