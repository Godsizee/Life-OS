import { z } from 'zod';

export const inviteEmailSchema = z.string().email();
