import * as z from 'zod/mini';
import { ATTACHMENT_ENTITY_TYPES } from './types';

export const attachmentSchema = z.object({
	id: z.uuid(),
	workspace_id: z.uuid(),
	entity_type: z.enum(ATTACHMENT_ENTITY_TYPES),
	entity_id: z.uuid(),
	storage_path: z.string().check(z.minLength(1)),
	mime_type: z.string().check(z.minLength(1)),
	size_bytes: z.int().check(z.nonnegative()),
	width: z.nullable(z.int().check(z.positive())),
	height: z.nullable(z.int().check(z.positive())),
	created_by: z.uuid(),
	created_at: z.string()
});
