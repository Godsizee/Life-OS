export type GoalStatus = 'open' | 'in_progress' | 'done';

export interface Goal {
	id: string;
	workspace_id: string;
	parent_id: string | null;
	title: string;
	description: string;
	target_date: string | null;
	progress: number;
	status: GoalStatus;
	created_by: string;
	created_at: string;
	updated_at: string;
}

// Tagebuch ist persoenlich (RLS: owner-only), getrennt von den geteilten Zielen oben.
export interface JournalEntry {
	id: string;
	workspace_id: string;
	user_id: string;
	date: string;
	mood: string | null;
	body: string;
	created_at: string;
	updated_at: string;
}
