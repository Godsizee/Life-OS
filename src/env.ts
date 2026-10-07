import { building } from '$app/env';
import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';

// Namen bleiben VITE_*, damit sich in Coolify nichts ändert. Öffentlich und dynamisch:
// gelesen beim Serverstart. Kit prüft die Schemas aber auch beim Build — dort fehlen
// die Werte (Nixpacks/CI), deshalb erst zur Laufzeit streng.
const pflicht = <T extends z.ZodType>(schema: T) => (building ? z.string().optional() : schema);

export const variables = defineEnvVars({
	VITE_SUPABASE_URL: {
		public: true,
		schema: pflicht(z.url()),
		description: 'Supabase-URL, Prod: https://sb.dasdann.jetzt'
	},
	VITE_SUPABASE_ANON_KEY: {
		public: true,
		schema: pflicht(z.string().min(20)),
		description: 'Öffentlicher Anon-Key (RLS schützt die Daten)'
	},
	VITE_VAPID_PUBLIC_KEY: {
		public: true,
		schema: z.string().optional(),
		description: 'Öffentlicher VAPID-Schlüssel für Web-Push'
	}
});
