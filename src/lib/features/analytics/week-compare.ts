// W10 — Vorwochenvergleich für den Weekly Review. Rein, testbar: keine Store-Abhängigkeit.

export interface Kennzahl {
	id: string;
	label: string;
	wert: number;
	/** Wert derselben Kennzahl in der Vorwoche; null, wenn keine Daten vorliegen. */
	vorwoche: number | null;
	/** Formatierung des Werts für die Anzeige. */
	format?: (v: number) => string;
	/** true = mehr ist besser (Standard), false = weniger ist besser. */
	hoeherIstBesser?: boolean;
}

export interface Vergleich {
	richtung: 'up' | 'down' | 'flat';
	/** Absolute Differenz. */
	delta: number;
	/** Relative Änderung in Prozent; null, wenn die Vorwoche 0 war. */
	prozent: number | null;
	/** true, wenn die Richtung für den Nutzer gut ist. */
	gut: boolean;
	label: string;
}

const SCHWELLE = 0.05; // unter 5 % Änderung gilt als unverändert

export function vergleiche(k: Kennzahl): Vergleich | null {
	if (k.vorwoche === null) return null;
	const delta = Math.round((k.wert - k.vorwoche) * 100) / 100;
	const prozent = k.vorwoche === 0 ? null : Math.round((delta / k.vorwoche) * 100);
	const relevant = k.vorwoche === 0 ? delta !== 0 : Math.abs(delta / k.vorwoche) >= SCHWELLE;
	const richtung: Vergleich['richtung'] = !relevant ? 'flat' : delta > 0 ? 'up' : 'down';
	const hoeher = k.hoeherIstBesser ?? true;
	const gut = richtung === 'flat' ? true : (richtung === 'up') === hoeher;
	const vorzeichen = delta > 0 ? '+' : '';
	return {
		richtung,
		delta,
		prozent,
		gut,
		label:
			richtung === 'flat'
				? 'wie letzte Woche'
				: `${vorzeichen}${(k.format ?? String)(delta)} zur Vorwoche`
	};
}
