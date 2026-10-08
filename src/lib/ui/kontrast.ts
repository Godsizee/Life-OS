/** WCAG 2.x: relative Luminanz und Kontrastverhältnis zweier 6-stelliger Hex-Farben. */
const kanal = (c: number) => {
	const s = c / 255;
	return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const luminanz = (hex: string) => {
	const h = hex.replace('#', '');
	const [r, g, b] = [0, 2, 4].map((i) => kanal(parseInt(h.slice(i, i + 2), 16)));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const kontrast = (a: string, b: string) => {
	const [hi, lo] = [luminanz(a), luminanz(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
};
