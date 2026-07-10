export interface HealthEntry {
	id: string;
	workspace_id: string;
	user_id: string;
	date: string;
	weight_kg: number | null;
	sleep_h: number | null;
	water_glasses: number | null;
	energy: 1 | 2 | 3 | 4 | 5 | null;
}
