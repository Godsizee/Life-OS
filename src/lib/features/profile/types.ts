import type { WaterUnit, WeightUnit } from './units';

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
	/** Anzeige-Einheit für Wasser. Gespeichert wird immer in ml (health_entries.water_ml). */
	water_unit?: WaterUnit;
	/** Größe eines Glases in ml — nur relevant bei water_unit === 'glasses'. */
	glass_size_ml?: number;
	/** Tagesziel Wasser in ml. Löst water_goal_glasses ab (dieses bleibt für Altdaten stehen). */
	water_goal_ml?: number;
	/** Anzeige-Einheit für Gewicht. Gespeichert wird immer in kg. */
	weight_unit?: WeightUnit;
	/** Körpergröße in cm — nur für die BMI-Anzeige. */
	height_cm?: number;
	/** Tagesziel Fokuszeit in Minuten. Ohne Wert abgeleitet aus focus_minutes × Runden. */
	focus_daily_goal_minutes?: number;
	/** Modul-IDs in der mobilen Bottom-Nav (genau 4). Ohne Wert: bottomNavModuleIds. */
	nav_module_ids?: string[];
	/** Reihenfolge der Dashboard-Kacheln. Unbekannte IDs werden ignoriert, fehlende angehängt. */
	dashboard_card_order?: string[];
}
