export interface HealthEntry {
	id: string;
	workspace_id: string;
	user_id: string;
	date: string;
	/** numeric in Postgres — kann als String ankommen, immer ueber stats.num() lesen. */
	weight_kg: number | null;
	sleep_h: number | null;
	water_glasses: number | null;
	energy: 1 | 2 | 3 | 4 | 5 | null;
}

/** W9 — die vier festen Metriken. Eigene Metriken sind bewusst gestrichen. */
export type HealthMetric = 'weight_kg' | 'sleep_h' | 'water_glasses' | 'energy';

export interface HealthValues {
	weight_kg: number | null;
	sleep_h: number | null;
	water_glasses: number | null;
	energy: number | null;
}
