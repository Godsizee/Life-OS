// W6 — reine Phasen-/Zeit-Logik der Fokus-Session. Keine Runes, kein Store-Zugriff:
// so ist sie in vitest (Node) testbar. Der Store in session.svelte.ts ruft nur hier auf.

export type FocusPhase = 'idle' | 'focus' | 'break' | 'long_break';

export interface FocusDurations {
	focusMinutes: number;
	breakMinutes: number;
	longBreakMinutes: number;
	roundsUntilLongBreak: number;
}

/** Dauer einer Phase in Sekunden. `idle` hat keine Dauer. */
export function phaseDurationSec(phase: FocusPhase, d: FocusDurations): number {
	if (phase === 'focus') return Math.max(60, Math.round(d.focusMinutes * 60));
	if (phase === 'break') return Math.max(60, Math.round(d.breakMinutes * 60));
	if (phase === 'long_break') return Math.max(60, Math.round(d.longBreakMinutes * 60));
	return 0;
}

/**
 * Welche Phase folgt auf eine abgelaufene?
 * `completedRoundsToday` = Fokus-Runden des Tages **inklusive** der eben beendeten.
 * Nach jeder `roundsUntilLongBreak`-ten Runde kommt die lange Pause.
 */
export function nextPhase(
	current: FocusPhase,
	completedRoundsToday: number,
	d: FocusDurations
): FocusPhase {
	if (current !== 'focus') return 'focus';
	const per = Math.max(2, Math.round(d.roundsUntilLongBreak));
	return completedRoundsToday > 0 && completedRoundsToday % per === 0 ? 'long_break' : 'break';
}

/** Verbleibende Sekunden bis `endsAt` (epoch ms). Nie negativ. */
export function remainingSec(endsAt: number | null, now: number): number {
	if (endsAt === null) return 0;
	return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

/** „24:59" — mm:ss, ab einer Stunde h:mm:ss. */
export function formatClock(totalSec: number): string {
	const s = Math.max(0, Math.floor(totalSec));
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = s % 60;
	const mm = String(m).padStart(2, '0');
	const ss = String(sec).padStart(2, '0');
	return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Buchbare Minuten beim vorzeitigen Beenden.
 * Unter 30 Sekunden wird nichts gebucht (Fehl-Tipps erzeugen keine Einträge).
 */
export function bookableMinutes(phaseTotalSec: number, remaining: number): number {
	const elapsed = Math.max(0, phaseTotalSec - remaining);
	return elapsed >= 30 ? Math.max(1, Math.round(elapsed / 60)) : 0;
}

/** 0..1 — abgelaufener Anteil der Phase, für den Ring. */
export function phaseProgress(phaseTotalSec: number, remaining: number): number {
	if (phaseTotalSec <= 0) return 0;
	return Math.min(1, Math.max(0, 1 - remaining / phaseTotalSec));
}

/** Anzeige-Label der Phase. */
export function phaseLabel(phase: FocusPhase): string {
	if (phase === 'focus') return 'Fokus';
	if (phase === 'break') return 'Pause';
	if (phase === 'long_break') return 'Lange Pause';
	return 'Bereit';
}

/** „Runde 3/4" — 1-basiert, zyklisch über die Runden des Tages. */
export function roundLabel(completedRoundsToday: number, d: FocusDurations): string {
	const per = Math.max(2, Math.round(d.roundsUntilLongBreak));
	return `Runde ${(completedRoundsToday % per) + 1}/${per}`;
}
