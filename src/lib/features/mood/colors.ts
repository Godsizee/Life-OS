// Eine Quelle für alle Stimmungsfarben, nur über Tokens (app.css).
// Stufe 1 = Gefahr-Rot, 5 = Ziele-Grün. Text darauf steht immer in --auf-farbe; die Stufe
// steht zusätzlich als Wort daneben (nie nur Farbe).

/** Füllfarbe je Stimmungsstufe (CSS-Wert, auch für SVG `fill`). */
const FARBE: Record<number, string> = {
	1: 'var(--gefahr)',
	2: 'var(--mod-shopping)',
	3: 'var(--mod-dashboard)',
	4: 'var(--mod-notes)',
	5: 'var(--mod-goals)'
};

const LEER = 'var(--flaeche-2)';

/** Tailwind-Klassen für Farbfelder im DOM (Legende, Chips), Score 1..5. */
export const MOOD_CLASSES: Record<number, string> = {
	1: 'bg-gefahr border border-tinte',
	2: 'bg-mod-shopping border border-tinte',
	3: 'bg-mod-dashboard border border-tinte',
	4: 'bg-mod-notes border border-tinte',
	5: 'bg-mod-goals border border-tinte'
};

/** Farbe einer Stimmungsstufe. `null` oder unbekannt = kein Eintrag. */
export function moodHex(score: number | null): string {
	if (score === null) return LEER;
	return FARBE[score] ?? LEER;
}
