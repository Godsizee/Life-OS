/**
 * W4 Reminder-Infra — generische Erinnerungen für beliebige Entitäten.
 * Muster: entity_links (Welle 5.1). Neue Typen brauchen KEINE Migration,
 * nur eine Ergänzung dieser Union + des Zod-Enums in schema.ts.
 */
export type ReminderEntityType = 'task' | 'event' | 'habit' | 'goal' | 'health' | 'custom';

export interface Reminder {
	id: string;
	workspace_id: string;
	/** Empfänger des Pushes (v1 immer der Ersteller). */
	user_id: string;
	entity_type: ReminderEntityType;
	/** null bei entity_type === 'custom'. */
	entity_id: string | null;
	/** Eingefrorener Push-Titel. */
	title: string;
	body: string | null;
	/** Deep-Link, den notificationclick öffnet. */
	url: string;
	/** Nächster Fälligkeitszeitpunkt (ISO, UTC). */
	remind_at: string;
	/** null = einmalig; sonst 'RRULE:FREQ=DAILY|WEEKLY|MONTHLY[;INTERVAL=n][;BYDAY=…]'. */
	rrule: string | null;
	/** Minuten VOR der Ankerzeit der Entität (nur Modus 'offset', sonst 0). */
	offset_minutes: number;
	active: boolean;
	last_sent_at: string | null;
	created_by: string;
	created_at: string;
	updated_at: string;
}
