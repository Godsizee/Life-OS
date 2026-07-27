// Welle 3.3 — Zeiterfassung: Pomodoro-Sessions und manuelle Einträge pro Aufgabe.
export type TimeSource = 'pomodoro' | 'manual';

export interface TimeEntry {
	id: string;
	workspace_id: string;
	user_id: string;
	task_id: string | null;
	started_at: string;
	ended_at: string | null;
	/** numeric in Postgres — kann als String ankommen, immer über minutesOf() lesen. */
	duration_min: number;
	source: TimeSource;
	/** W6 — Freitext für manuelle Nachträge ohne Aufgabe. */
	note: string | null;
	created_at: string;
}
