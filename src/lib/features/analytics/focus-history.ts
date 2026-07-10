/**
 * Liest abgeschlossene Pomodoros für beliebige vergangene Tage aus localStorage.
 * Fällt auf 0 zurück wenn kein Eintrag oder kein localStorage verfügbar.
 */
export function getPomodorosForDate(dateStr: string): number {
	if (typeof window === 'undefined') return 0;
	try {
		const val = localStorage.getItem(`pomodoros_${dateStr}`);
		return val ? parseInt(val, 10) : 0;
	} catch {
		return 0;
	}
}
