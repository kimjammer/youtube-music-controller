/**
 * Measures character and text pixel widths for proportional fonts (Segoe UI / sans-serif).
 * Accurately models fullwidth Unicode (Hangul/Korean, CJK ideographs, Japanese kana, fullwidth forms)
 * and proportional Latin characters.
 */

export function measureCharWidth(char: string, fontSize: number, isBold: boolean = false): number {
	const boldFactor = isBold ? 1.08 : 1.0;
	const code = char.charCodeAt(0);

	// Fullwidth / East Asian scripts (Hangul, CJK Ideographs, Kana, Fullwidth forms)
	if (
		(code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
		(code >= 0x3400 && code <= 0x4dbf) || // CJK Extension A
		(code >= 0xac00 && code <= 0xd7af) || // Hangul Syllables (Korean)
		(code >= 0x1100 && code <= 0x11ff) || // Hangul Jamo
		(code >= 0x3130 && code <= 0x318f) || // Hangul Compatibility Jamo
		(code >= 0x3040 && code <= 0x309f) || // Hiragana
		(code >= 0x30a0 && code <= 0x30ff) || // Katakana
		(code >= 0xff00 && code <= 0xffef)    // Fullwidth Forms
	) {
		return Math.round(fontSize * 1.05 * boldFactor * 10) / 10;
	}

	// Latin & common ASCII characters proportional width ratios for Segoe UI
	let ratio = 0.55;

	if ("ijl|'!,;:.".includes(char)) {
		ratio = 0.28;
	} else if ("jtfI[]()/\\`".includes(char)) {
		ratio = 0.38;
	} else if ("r-\"*^".includes(char)) {
		ratio = 0.42;
	} else if ("sczkvxy?".includes(char)) {
		ratio = 0.50;
	} else if ("abdeghnopqu".includes(char) || (char >= "0" && char <= "9")) {
		ratio = 0.56;
	} else if (char >= "A" && char <= "Z") {
		ratio = 0.68;
	} else if ("mwMW&%+<=>".includes(char)) {
		ratio = 0.85;
	} else if (char === "@") {
		ratio = 0.95;
	} else if (char === " ") {
		ratio = 0.30;
	} else if (code > 127) {
		// Other Unicode alphabets (Cyrillic, Greek, accented Latin, etc.)
		ratio = 0.60;
	}

	return Math.round(ratio * fontSize * boldFactor * 10) / 10;
}

export function measureTextWidth(text: string, fontSize: number, isBold: boolean = false): number {
	let total = 0;
	for (let i = 0; i < text.length; i++) {
		total += measureCharWidth(text[i], fontSize, isBold);
	}
	return Math.ceil(total);
}
