export const ATTACHMENT_ENTITY_TYPES = ['note', 'journal', 'task'] as const;
export type AttachmentEntityType = (typeof ATTACHMENT_ENTITY_TYPES)[number];

export interface Attachment {
	id: string;
	workspace_id: string;
	entity_type: AttachmentEntityType;
	entity_id: string;
	/** <workspace_id>/<entity_type>/<entity_id>/<uuid>.<ext> */
	storage_path: string;
	mime_type: string;
	size_bytes: number;
	width: number | null;
	height: number | null;
	created_by: string;
	created_at: string;
}
