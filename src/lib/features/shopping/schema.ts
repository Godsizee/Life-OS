import { z } from 'zod';

export const shoppingItemInputSchema = z.object({
  name: z.string().min(1).max(100),
  qty: z.number().positive().default(1),
  unit: z.string().nullable().default(null),
  category: z.string().nullable().default(null),
  note: z.string().max(500).nullable().default(null)
});

export type ShoppingItemInput = z.infer<typeof shoppingItemInputSchema>;
