import { measureTextWidth } from "./text-measure";

/**
 * Escapes special XML characters so song titles and artist names don't break SVG markup.
 */
export function escapeXml(str: string): string {
	return str.replace(/[<>&'"]/g, (c) => {
		switch (c) {
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case "&":
				return "&amp;";
			case "'":
				return "&apos;";
			case '"':
				return "&quot;";
			default:
				return c;
		}
	});
}

interface LineState {
	text: string;
	escapedText: string;
	width: number;
	needsScroll: boolean;
	offset: number;
	pauseCountdown: number;
}

const GAP = 45; // Gap in pixels between repeated text in the loop
const PAUSE_TICKS = 18; // ~1.8s hold at 10Hz (100ms/tick)

export class SvgScroller {
	private readonly canvasWidth: number;
	private readonly canvasHeight: number;

	private title: LineState = {
		text: "",
		escapedText: "",
		width: 0,
		needsScroll: false,
		offset: 0,
		pauseCountdown: PAUSE_TICKS
	};

	private artist: LineState = {
		text: "",
		escapedText: "",
		width: 0,
		needsScroll: false,
		offset: 0,
		pauseCountdown: PAUSE_TICKS
	};

	constructor(
		canvasWidth = 170,
		canvasHeight = 34,
		initialTitle = "No Song Playing",
		initialArtist = "YouTube Music"
	) {
		this.canvasWidth = canvasWidth;
		this.canvasHeight = canvasHeight;
		this.setTexts(initialTitle, initialArtist);
	}

	public setTexts(title: string, artist: string): void {
		if (this.title.text !== title) {
			const width = measureTextWidth(title, 13, true);
			this.title = {
				text: title,
				escapedText: escapeXml(title),
				width,
				needsScroll: width > this.canvasWidth,
				offset: 0,
				pauseCountdown: PAUSE_TICKS
			};
		}

		if (this.artist.text !== artist) {
			const width = measureTextWidth(artist, 11, false);
			this.artist = {
				text: artist,
				escapedText: escapeXml(artist),
				width,
				needsScroll: width > this.canvasWidth,
				offset: 0,
				pauseCountdown: PAUSE_TICKS
			};
		}
	}

	/**
	 * Advances the marquee offset by one tick based on scrollSpeed (1-10).
	 * Returns true if the visual frame changed, false if both lines were paused or static.
	 */
	public tick(scrollSpeed = 5): boolean {
		let changed = false;
		const speed = Math.min(10, Math.max(1, scrollSpeed));
		const step = 0.5 + speed * 0.3; // Speed 1: 0.8px, Speed 5: 2.0px, Speed 10: 3.5px per tick at 10Hz

		// Tick title
		if (this.title.needsScroll) {
			if (this.title.pauseCountdown > 0) {
				this.title.pauseCountdown--;
			} else {
				this.title.offset -= step;
				changed = true;
				// When first instance has fully scrolled past with gap, reset seamlessly to 0
				if (this.title.offset <= -(this.title.width + GAP)) {
					this.title.offset = 0;
					this.title.pauseCountdown = PAUSE_TICKS;
				}
			}
		}

		// Tick artist
		if (this.artist.needsScroll) {
			if (this.artist.pauseCountdown > 0) {
				this.artist.pauseCountdown--;
			} else {
				this.artist.offset -= step;
				changed = true;
				// When first instance has fully scrolled past with gap, reset seamlessly to 0
				if (this.artist.offset <= -(this.artist.width + GAP)) {
					this.artist.offset = 0;
					this.artist.pauseCountdown = PAUSE_TICKS;
				}
			}
		}

		return changed;
	}

	/**
	 * Returns true if either title or artist requires ongoing scrolling.
	 */
	public get isScrollingActive(): boolean {
		return this.title.needsScroll || this.artist.needsScroll;
	}

	/**
	 * Generates the SVG string and encodes it as a base64 data URI for Stream Deck pixmap feedback.
	 */
	public renderDataUri(): string {
		const titleX = this.title.offset;
		const artistX = this.artist.offset;
		const titleY = this.canvasHeight > 36 ? 16 : 15;
		const artistY = this.canvasHeight > 36 ? 32 : 30;

		const titleSecond = this.title.needsScroll
			? `<text x="${(titleX + this.title.width + GAP).toFixed(1)}" y="${titleY}" font-family="Segoe UI, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#FFFFFF">${this.title.escapedText}</text>`
			: "";

		const artistSecond = this.artist.needsScroll
			? `<text x="${(artistX + this.artist.width + GAP).toFixed(1)}" y="${artistY}" font-family="Segoe UI, -apple-system, sans-serif" font-size="11" font-weight="400" fill="#AAAAAA">${this.artist.escapedText}</text>`
			: "";

		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.canvasWidth}" height="${this.canvasHeight}" viewBox="0 0 ${this.canvasWidth} ${this.canvasHeight}">` +
			`<defs><clipPath id="c"><rect x="0" y="0" width="${this.canvasWidth}" height="${this.canvasHeight}"/></clipPath></defs>` +
			`<g clip-path="url(#c)">` +
			`<text x="${titleX.toFixed(1)}" y="${titleY}" font-family="Segoe UI, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#FFFFFF">${this.title.escapedText}</text>` +
			titleSecond +
			`<text x="${artistX.toFixed(1)}" y="${artistY}" font-family="Segoe UI, -apple-system, sans-serif" font-size="11" font-weight="400" fill="#AAAAAA">${this.artist.escapedText}</text>` +
			artistSecond +
			`</g></svg>`;

		return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
	}
}
