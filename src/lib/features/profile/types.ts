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
}

