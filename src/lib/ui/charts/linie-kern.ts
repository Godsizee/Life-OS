/** Reine Rechnung für `Linie.svelte`, damit sie ohne Browser testbar bleibt. */

export interface LiniePunkt {
	label: string;
	/** null = an diesem Tag fehlt der Wert: Die Linie bricht dort ab. */
	value: number | null;
}

export interface LinieMass {
	breite: number;
	hoehe: number;
	/** Abstand zum Rand, damit Quadrate und Linie nicht abgeschnitten werden. */
	rand: number;
}

export interface Bereich {
	min: number;
	max: number;
}

/**
 * Wertebereich über alle Reihen. Liegen die Werte nahe bei 0 oder darunter, beginnt die Achse bei 0.
 * Liegen sie weit darüber (z. B. Gewicht 82 bis 84 kg), zoomt die Achse auf den Bereich mit etwas Luft,
 * sonst wäre die Linie flach. Feste Enden (`vorgabe`) gelten immer.
 */
export function wertebereich(
	reihen: (number | null)[][],
	zusatz: number[] = [],
	vorgabe: { min?: number; max?: number } = {}
): Bereich {
	const werte = [...reihen.flat().filter((v): v is number => v !== null), ...zusatz];
	if (werte.length === 0) return { min: vorgabe.min ?? 0, max: vorgabe.max ?? 1 };
	const lo = Math.min(...werte);
	const hi = Math.max(...werte);
	if (lo < 0 || lo <= hi * 0.5)
		return { min: vorgabe.min ?? Math.min(0, lo), max: vorgabe.max ?? hi };
	const luft = (hi - lo) * 0.15 || 1;
	return { min: vorgabe.min ?? lo - luft, max: vorgabe.max ?? hi + luft * 0.6 };
}

export function xPos(index: number, anzahl: number, mass: LinieMass): number {
	if (anzahl <= 1) return mass.breite / 2;
	return mass.rand + (index / (anzahl - 1)) * (mass.breite - mass.rand * 2);
}

export function yPos(wert: number, bereich: Bereich, mass: LinieMass): number {
	const spanne = bereich.max - bereich.min || 1;
	const nutzbar = mass.hoehe - mass.rand * 2;
	return mass.hoehe - mass.rand - ((wert - bereich.min) / spanne) * nutzbar;
}

export function koordinaten(
	punkte: LiniePunkt[],
	bereich: Bereich,
	mass: LinieMass
): ({ x: number; y: number } | null)[] {
	return punkte.map((p, i) =>
		p.value === null ? null : { x: xPos(i, punkte.length, mass), y: yPos(p.value, bereich, mass) }
	);
}

/** SVG-Pfad; an jeder Lücke beginnt ein neues Stück (`M`). */
export function pfad(koords: ({ x: number; y: number } | null)[]): string {
	let d = '';
	let zeichnet = false;
	for (const k of koords) {
		if (k === null) {
			zeichnet = false;
			continue;
		}
		d += `${zeichnet ? 'L' : 'M'}${k.x.toFixed(1)},${k.y.toFixed(1)} `;
		zeichnet = true;
	}
	return d.trim();
}
