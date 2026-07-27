export interface Note {
	id: string;
	workspace_id: string;
	title: string;
	body: string;
	tags: string[];
	pinned: boolean;
	/** true = nur fuer created_by sichtbar (per RLS erzwungen). */
	private: boolean;
	/** Bestandszeilen vor W7 wurden aus updated_by befuellt; nie null in der DB. */
	created_by: string | null;
	updated_by: string;
	created_at: string;
	updated_at: string;
}
