export interface Note {
	id: string;
	workspace_id: string;
	title: string;
	body: string;
	tags: string[];
	pinned: boolean;
	updated_by: string;
	created_at: string;
	updated_at: string;
}
