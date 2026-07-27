export interface ProfileSettings {
	weekly_workout_goal?: number;
	/** Welle F6 — Pausen-Timer-Dauer im Live-Workout (Sekunden). */
	rest_timer_seconds?: number;
	/** W6 — Länge einer Fokus-Runde in Minuten. */
	focus_minutes?: number;
	/** W6 — Länge der kurzen Pause in Minuten. */
	focus_break_minutes?: number;
	/** W6 — Länge der langen Pause in Minuten. */
	focus_long_break_minutes?: number;
	/** W6 — Fokus-Runden bis zur langen Pause. */
	focus_rounds_until_long_break?: number;
	/** W9 — Wasserziel in Gläsern pro Tag. */
	water_goal_glasses?: number;
	/** W9 — Schlafziel in Stunden pro Nacht. */
	sleep_goal_h?: number;
	/** W9 — Zielgewicht in kg. null/undefined = kein Zielgewicht gesetzt. */
	weight_goal_kg?: number | null;
}

