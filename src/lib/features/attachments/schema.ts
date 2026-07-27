import { z } from 'zod';
import { ATTACHMENT_ENTITY_TYPES } from './types';

export const attachmentSchema = z.object({
	id: z.string().uuid(),
	workspace_id: z.string().uuid(),
	entity_type: z.enum(ATTACHMENT_ENTITY_TYPES),
	entity_id: z.string().uuid(),
	storage_path: z.string().min(1),
	mime_type: z.string().min(1),
	size_bytes: z.number().int().nonnegative(),
	width: z.number().int().positive().nullable(),
	height: z.number().int().positive().nullable(),
	created_by: z.string().uuid(),
	created_at: z.string()
});
