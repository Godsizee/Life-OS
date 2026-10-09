import * as z from 'zod/mini';
import { normalizeUnit } from './categories';

export const shoppingItemInputSchema = z.object({
	name: z.string().check(z.minLength(1), z.maxLength(100)),
	qty: z._default(z.number().check(z.positive()), 1),
	unit: z.pipe(z._default(z.nullable(z.string()), null), z.transform(normalizeUnit)),
	category: z._default(z.nullable(z.string()), null),
	note: z._default(z.nullable(z.string().check(z.maxLength(500))), null),
	assignee_id: z.optional(z.nullable(z.uuid())),
	list_id: z.optional(z.nullable(z.uuid()))
});

export type ShoppingItemInput = z.infer<typeof shoppingItemInputSchema>;
