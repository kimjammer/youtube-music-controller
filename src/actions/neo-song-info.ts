import {
	action,
	DidReceiveSettingsEvent,
	NeoInfobarAction,
	SingletonAction,
	WillAppearEvent,
	WillDisappearEvent
} from "@elgato/streamdeck";
import { Jimp } from "jimp";
import { ApiClient } from "../common/api-client";
import { Endpoints } from "../common/endpoints";
import { WsClient } from "../common/ws-client";
import {
	DataTypes,
	PlayerInfoData,
	PlayerStateChangedData,
	PositionChangedData,
	SongInfo,
	VideoChangedData
} from "../common/api-types";
import { SvgScroller } from "../common/svg-scroller";
import { MarqueeScroller } from "../common/marquee-scroller";

const DEFAULT_ARTWORK = "imgs/plugin/category-icon.png";
const LAYOUT_SVG = "layouts/now-playing-progress.json";
const LAYOUT_TEXT = "layouts/now-playing-progress-text.json";

interface ActionEntry {
	action: NeoInfobarAction<NeoSongInfoSettings>;
	settings: NeoSongInfoSettings;
	layout: string;
}

/**
 * Displays song title, artist, artwork, and track progress on the Stream Deck Neo Infobar,
 * with customizable scrolling (smooth SVG or character marquee) and speed settings.
 */
@action({ UUID: "com.kimjammer.youtube-music-controller.neo-song-info" })
export class NeoSongInfo extends SingletonAction<NeoSongInfoSettings> {
	private entries: ActionEntry[] = [];

	private svgScroller = new SvgScroller(170, 34);
	private titleScroller = new MarqueeScroller(22);
	private artistScroller = new MarqueeScroller(26);

	private artwork: string = DEFAULT_ARTWORK;
	private crrImageURL: string = "";
	private songDuration: number = 0;
	private position: number = 0;
	private isPlaying: boolean = false;
	private animationTimer: NodeJS.Timeout | null = null;
	private tickCounter: number = 0;
	private isUpdatingText: boolean = false;

	constructor(wsClient: WsClient) {
		super();

		this.svgScroller.setTexts("No Song Playing", "YouTube Music");
		this.titleScroller.setText("No Song Playing");
		this.artistScroller.setText("YouTube Music");

		wsClient.subscribe(DataTypes.PlayerInfo, this.onPlayerInfo.bind(this));
		wsClient.subscribe(DataTypes.VideoChanged, this.onVideoChanged.bind(this));
		wsClient.subscribe(DataTypes.PlayerStateChanged, this.onPlayerStateChanged.bind(this));
		wsClient.subscribe(DataTypes.PositionChanged, this.onPositionChanged.bind(this));
	}

	override async onWillAppear(ev: WillAppearEvent<NeoSongInfoSettings>): Promise<void> {
		if (!ev.action.isNeoInfobar()) {
			return;
		}

		const settings: NeoSongInfoSettings = {
			scrollerType: ev.payload.settings?.scrollerType ?? "smooth",
			scrollSpeed: Number(ev.payload.settings?.scrollSpeed) || 5
		};

		const targetLayout = settings.scrollerType === "marquee" ? LAYOUT_TEXT : LAYOUT_SVG;
		await ev.action.setFeedbackLayout(targetLayout);

		this.entries.push({ action: ev.action, settings, layout: targetLayout });
		this.ensureAnimationTimer();

		try {
			const songInfo: SongInfo = await ApiClient.get(Endpoints.Song);
			if (songInfo && songInfo.title) {
				this.isPlaying = !songInfo.isPaused;
				await this.applySongData(songInfo, songInfo.elapsedSeconds ?? 0);
			} else {
				await this.updateAllInstances();
			}
		} catch {
			await this.updateAllInstances();
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<NeoSongInfoSettings>): Promise<void> {
		const entry = this.entries.find((e) => e.action.id === ev.action.id);
		if (!entry) return;

		const newSettings: NeoSongInfoSettings = {
			scrollerType: ev.payload.settings?.scrollerType ?? "smooth",
			scrollSpeed: Number(ev.payload.settings?.scrollSpeed) || 5
		};
		entry.settings = newSettings;

		const targetLayout = newSettings.scrollerType === "marquee" ? LAYOUT_TEXT : LAYOUT_SVG;
		if (entry.layout !== targetLayout) {
			entry.layout = targetLayout;
			await entry.action.setFeedbackLayout(targetLayout);
		}

		await this.updateEntryFeedback(entry);
	}

	override onWillDisappear(ev: WillDisappearEvent<NeoSongInfoSettings>): void {
		this.entries = this.entries.filter((e) => e.action.id !== ev.action.id);
		if (this.entries.length === 0 && this.animationTimer) {
			clearInterval(this.animationTimer);
			this.animationTimer = null;
		}
	}

	private ensureAnimationTimer(): void {
		if (!this.animationTimer) {
			// Master ticker at 100ms (10 FPS / 10 Hz)
			this.animationTimer = setInterval(() => {
				this.tickCounter++;

				const speed = this.entries[0]?.settings.scrollSpeed ?? 5;
				const anySvg = this.entries.some((e) => e.settings.scrollerType !== "marquee");
				const anyMarquee = this.entries.some((e) => e.settings.scrollerType === "marquee");

				let svgChanged = false;
				if (anySvg) {
					svgChanged = this.svgScroller.tick(speed);
				}

				let marqueeChanged = false;
				if (anyMarquee) {
					const charInterval = Math.max(1, Math.round(6 - ((speed - 1) * (5 / 9))));
					if (this.tickCounter % charInterval === 0) {
						const t1 = this.titleScroller.tick();
						const t2 = this.artistScroller.tick();
						marqueeChanged = t1 || t2;
					}
				}

				if (svgChanged || marqueeChanged) {
					this.updateTextOnly(svgChanged, marqueeChanged);
				}

				// 1-second interval for track progress (every 10 ticks at 100ms = 1000ms)
				if (this.tickCounter % 10 === 0) {
					if (this.isPlaying && this.songDuration > 0 && this.position < this.songDuration) {
						this.position += 1;
						this.updateProgressOnly();
					}
				}
			}, 100);
		}
	}

	private async onPlayerInfo(data: PlayerInfoData): Promise<void> {
		this.isPlaying = data.isPlaying ?? false;
		if (data.song) {
			await this.applySongData(data.song, data.position ?? 0);
		} else {
			this.svgScroller.setTexts("No Song Playing", "YouTube Music");
			this.titleScroller.setText("No Song Playing");
			this.artistScroller.setText("YouTube Music");
			this.artwork = DEFAULT_ARTWORK;
			this.crrImageURL = "";
			this.songDuration = 0;
			this.position = 0;
			this.isPlaying = false;
			await this.updateAllInstances();
		}
	}

	private async onPlayerStateChanged(data: PlayerStateChangedData): Promise<void> {
		this.isPlaying = data.isPlaying ?? false;
		if (data.position !== undefined) {
			this.position = data.position;
		}
		this.updateProgressOnly();
	}

	private async onVideoChanged(data: VideoChangedData): Promise<void> {
		if (data.song) {
			if (data.song.isPaused === false) {
				this.isPlaying = true;
			} else if (data.song.isPaused === true) {
				try {
					const song: SongInfo = await ApiClient.get(Endpoints.Song);
					this.isPlaying = !song.isPaused;
				} catch {
					this.isPlaying = true;
				}
			} else {
				this.isPlaying = true;
			}
			await this.applySongData(data.song, data.position ?? 0);
		}
	}

	private async onPositionChanged(data: PositionChangedData): Promise<void> {
		if (data.position !== undefined) {
			this.position = data.position;
			this.updateProgressOnly();
		}
	}

	private async applySongData(song: SongInfo, position: number): Promise<void> {
		const title = song.title || "No Song Playing";
		const artist = song.artist || "YouTube Music";

		this.svgScroller.setTexts(title, artist);
		this.titleScroller.setText(title);
		this.artistScroller.setText(artist);

		this.songDuration = song.songDuration || 0;
		this.position = position;

		const imgUrl = song.imageSrc ?? "";
		if (imgUrl !== this.crrImageURL) {
			this.crrImageURL = imgUrl;
			if (imgUrl) {
				try {
					const albumImage = await Jimp.read(imgUrl);
					const processed = albumImage.scaleToFit({ w: 50, h: 50 });
					this.artwork = await processed.getBase64("image/png");
				} catch {
					this.artwork = DEFAULT_ARTWORK;
				}
			} else {
				this.artwork = DEFAULT_ARTWORK;
			}
		}

		await this.updateAllInstances();
	}

	private calculateProgress(): number {
		if (this.songDuration <= 0) return 0;
		return Math.min(100, Math.max(0, Math.round((this.position / this.songDuration) * 100)));
	}

	private async updateTextOnly(svgChanged: boolean, marqueeChanged: boolean): Promise<void> {
		if (this.isUpdatingText || this.entries.length === 0) return;
		this.isUpdatingText = true;
		try {
			let svgUri: string | null = null;
			for (const entry of this.entries) {
				try {
					if (entry.settings.scrollerType === "marquee" && marqueeChanged) {
						await entry.action.setFeedback({
							title: this.titleScroller.currentText,
							artist: this.artistScroller.currentText
						});
					} else if (entry.settings.scrollerType !== "marquee" && svgChanged) {
						if (!svgUri) svgUri = this.svgScroller.renderDataUri();
						await entry.action.setFeedback({
							text_canvas: svgUri
						});
					}
				} catch {
					// Ignore transient errors
				}
			}
		} finally {
			this.isUpdatingText = false;
		}
	}

	private async updateProgressOnly(): Promise<void> {
		const progress = this.calculateProgress();
		for (const entry of this.entries) {
			try {
				await entry.action.setFeedback({
					progress: {
						value: progress
					}
				});
			} catch {
				// Ignore transient errors
			}
		}
	}

	private async updateEntryFeedback(entry: ActionEntry): Promise<void> {
		const progress = this.calculateProgress();
		if (entry.settings.scrollerType === "marquee") {
			await entry.action.setFeedback({
				artwork: this.artwork,
				title: this.titleScroller.currentText,
				artist: this.artistScroller.currentText,
				progress: {
					value: progress
				}
			});
		} else {
			await entry.action.setFeedback({
				artwork: this.artwork,
				text_canvas: this.svgScroller.renderDataUri(),
				progress: {
					value: progress
				}
			});
		}
	}

	private async updateAllInstances(): Promise<void> {
		for (const entry of this.entries) {
			try {
				await this.updateEntryFeedback(entry);
			} catch {
				// Ignore transient errors
			}
		}
	}
}

/**
 * Settings for {@link NeoSongInfo}.
 */
export type NeoSongInfoSettings = {
	scrollerType?: "smooth" | "marquee";
	scrollSpeed?: number;
};
