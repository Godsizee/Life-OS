import { z } from 'zod';
import { normalizeUnit } from './categories';

export const shoppingItemInputSchema = z.object({
  name: z.string().min(1).max(100),
  qty: z.number().positive().default(1),
  unit: z.string().nullable().default(null).transform(normalizeUnit),
  category: z.string().nullable().default(null),
  note: z.string().max(500).nullable().default(null),
  assignee_id: z.string().uuid().nullable().optional(),
  list_id: z.string().uuid().nullable().optional()
});

export type ShoppingItemInput = z.infer<typeof shoppingItemInputSchema>;
