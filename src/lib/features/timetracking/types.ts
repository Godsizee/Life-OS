// Welle 3.3 — Zeiterfassung: Pomodoro-Sessions und manuelle Einträge pro Aufgabe.
export type TimeSource = 'pomodoro' | 'manual';

export interface TimeEntry {
	id: string;
	workspace_id: string;
	user_id: string;
	task_id: string | null;
	started_at: string;
	ended_at: string | null;
	duration_min: number;
	source: TimeSource;
	created_at: string;
}
