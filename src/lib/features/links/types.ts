// Welle 5.1 — Universal-Links: polymorphe Verknüpfung beliebiger Objekte.
export type LinkEntityType = 'task' | 'note' | 'event' | 'goal' | 'habit';

export interface EntityLink {
	id: string;
	workspace_id: string;
	source_type: LinkEntityType;
	source_id: string;
	target_type: LinkEntityType;
	target_id: string;
	created_by: string;
	created_at: string;
}

export interface LinkableEntity {
	type: LinkEntityType;
	id: string;
	title: string;
}
