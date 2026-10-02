/**
 * Handles standard character-by-character marquee text scrolling with pause-at-start and pause-at-loop.
 */
export class MarqueeScroller {
	private text: string = "";
	private readonly maxCharsVisible: number;
	private offset: number = 0;
	private holdTicks: number = 0;
	private readonly initialHold: number;
	private readonly loopHold: number;
	private readonly separator: string = "    •    ";

	/**
	 * @param maxCharsVisible Threshold character count above which text will scroll.
	 * @param initialHold Number of step ticks to pause before starting to scroll (~1.8s).
	 * @param loopHold Number of step ticks to pause when wrapping back to the beginning (~1.2s).
	 */
	constructor(maxCharsVisible: number, initialHold = 6, loopHold = 4) {
		this.maxCharsVisible = maxCharsVisible;
		this.initialHold = initialHold;
		this.loopHold = loopHold;
	}

	public setText(newText: string): void {
		const sanitized = (newText || "").trim();
		if (sanitized === this.text) return;
		this.text = sanitized;
		this.offset = 0;
		this.holdTicks = this.initialHold;
	}

	public get currentText(): string {
		if (!this.needsScroll()) {
			return this.text;
		}
		const full = this.text + this.separator + this.text;
		return full.slice(this.offset);
	}

	public needsScroll(): boolean {
		return this.text.length > this.maxCharsVisible;
	}

	/**
	 * Advances the marquee offset by one character step.
	 * @returns `true` if visible text changed and should be rendered, `false` otherwise.
	 */
	public tick(): boolean {
		if (!this.needsScroll()) {
			return false;
		}

		if (this.holdTicks > 0) {
			this.holdTicks--;
			return false;
		}

		this.offset++;
		const cycleLength = this.text.length + this.separator.length;
		if (this.offset >= cycleLength) {
			this.offset = 0;
			this.holdTicks = this.loopHold;
		}
		return true;
	}

	public reset(): void {
		this.offset = 0;
		this.holdTicks = this.initialHold;
	}
}
