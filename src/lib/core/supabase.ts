import { env } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

// Fehlt die Konfiguration, scheitert sonst erst die erste Query mit einer
// nichtssagenden Netzwerkmeldung — hier einmal laut und ohne Werte zu leaken.
if (!supabaseUrl || !supabaseAnonKey) {
	console.error(
		'Supabase ist nicht konfiguriert: VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY fehlen (.env).'
	);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
