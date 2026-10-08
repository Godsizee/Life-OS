/** Ein Eintrag je Person und Tag (Tabelle `day_rituals`, eindeutig über `user_id, date`). */
export interface DayRitual {
	id: string;
	workspace_id: string;
	user_id: string;
	/** 'yyyy-mm-dd' */
	date: string;
	planned_at: string | null;
	closed_at: string | null;
	capacity_min: number | null;
	intention: string | null;
	created_at: string;
	updated_at: string;
}
