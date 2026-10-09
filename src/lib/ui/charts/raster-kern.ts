/** Typen und Maße für `Raster.svelte`, rein und testbar. */

export interface RasterZelle {
	id: string;
	spalte: number;
	zeile: number;
	/** CSS-Farbe (Token bevorzugt); null = leere Zelle. */
	farbe: string | null;
	/** Kurzer Name der Zelle, z. B. „Mo., 5. Okt.“. */
	label: string;
	/** Wert als Text, z. B. „3 von 4 Routinen“. */
	text: string;
	heute?: boolean;
	/** Zelle ist nicht wählbar (z. B. in der Zukunft). */
	gesperrt?: boolean;
}

export interface RasterLabel {
	/** Spalten- bzw. Zeilenindex, an dem das Label steht. */
	index: number;
	text: string;
}

export interface RasterLegende {
	farbe: string | null;
	text: string;
}

export interface RasterMass {
	breite: number;
	hoehe: number;
	/** Abstand von Zelle zu Zelle. */
	schritt: number;
	/** Platz oben für Spaltenlabels. */
	kopf: number;
	/** Platz links für Zeilenlabels. */
	links: number;
}

export function rasterMass(
	spalten: number,
	zeilen: number,
	opt: { zelle: number; abstand: number; kopf: number; links: number }
): RasterMass {
	const schritt = opt.zelle + opt.abstand;
	return {
		breite: opt.links + spalten * schritt - opt.abstand + 2,
		hoehe: opt.kopf + zeilen * schritt - opt.abstand + 2,
		schritt,
		kopf: opt.kopf,
		links: opt.links
	};
}

const MONATE_KURZ = [
	'Jan',
	'Feb',
	'Mär',
	'Apr',
	'Mai',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Okt',
	'Nov',
	'Dez'
];

/** Spaltenlabels für ein Wochenraster: Der Monatsname steht über der Woche, in der der Monat beginnt. */
export function monatsLabels(wochen: string[][]): RasterLabel[] {
	const labels: RasterLabel[] = [];
	let letzter = -1;
	wochen.forEach((woche, index) => {
		const erster = woche[0];
		if (!erster) return;
		const monat = Number(erster.slice(5, 7)) - 1;
		if (monat !== letzter) {
			labels.push({ index, text: MONATE_KURZ[monat] ?? '' });
			letzter = monat;
		}
	});
	return labels;
}
