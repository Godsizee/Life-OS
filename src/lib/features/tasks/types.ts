/** `dropped` = bewusst losgelassen (Tagesabschluss): weder offen noch erledigt. */
export type TaskStatus = 'todo' | 'doing' | 'done' | 'dropped';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Project {
	id: string;
	workspace_id: string;
	name: string;
	color: string | null;
	archived: boolean;
	created_at: string;
}

export interface Task {
	id: string;
	workspace_id: string;
	project_id: string | null;
	goal_id: string | null;
	title: string;
	description: string | null;
	labels: string[];
	parent_id: string | null;
	status: TaskStatus;
	priority: TaskPriority;
	/** Frist (Muss). Getrennt von planned_for (Absicht). */
	due_at: string | null;
	/** Tag, an dem ich es tun will (Absicht), 'yyyy-mm-dd'. */
	planned_for: string | null;
	/** Geschätzte Dauer in Minuten (1–1440). */
	estimate_min: number | null;
	/** Zeitblock im Tagesplan (ISO), nur zusammen mit planned_for. */
	scheduled_start: string | null;
	assignee_id: string | null;
	rrule: string | null;
	position: number;
	created_by: string;
	created_at: string;
	updated_at: string;
	/** Zeitpunkt der Erledigung. null, solange die Aufgabe offen ist. */
	completed_at: string | null;
	/** W10 — Montag der Woche, für die diese Aufgabe im Weekly Review als Top-3 gewählt wurde. */
	focus_week: string | null;
}
