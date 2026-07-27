// W9 — eine Quelle fuer alle Stimmungsfarben.
// Tailwind-Klassen fuer DOM-Elemente, Hex fuer SVG (dort greift kein
// currentColor-Trick, Muster: WorkoutFrequencyHeatmap).

/** Chip-/Zellen-Klassen im DOM (Score 1..5). */
export const MOOD_CLASSES: Record<number, string> = {
	1: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50',
	2: 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50',
	3: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50',
	4: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50',
	5: 'bg-primary-700 dark:bg-primary-600 text-white border-transparent'
};

const HEX_LIGHT: Record<number, string> = {
	1: '#ef4444',
	2: '#f97316',
	3: '#eab308',
	4: '#818cf8',
	5: '#4f46e5'
};

const HEX_DARK: Record<number, string> = {
	1: '#b91c1c',
	2: '#c2410c',
	3: '#a16207',
	4: '#6366f1',
	5: '#4338ca'
};

const EMPTY_LIGHT = '#ECECF1';
const EMPTY_DARK = '#1F1F27';

/** Farbe einer Jahresraster-Zelle. score null = kein Eintrag. */
export function moodHex(score: number | null, isDark: boolean): string {
	if (score === null) return isDark ? EMPTY_DARK : EMPTY_LIGHT;
	const table = isDark ? HEX_DARK : HEX_LIGHT;
	return table[score] ?? (isDark ? EMPTY_DARK : EMPTY_LIGHT);
}
