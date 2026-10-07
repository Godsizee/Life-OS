import { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } from '$app/env/public';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = VITE_SUPABASE_URL || '';
const supabaseAnonKey = VITE_SUPABASE_ANON_KEY || '';

// Fehlt die Konfiguration, scheitert sonst erst die erste Query mit einer
// nichtssagenden Netzwerkmeldung — hier einmal laut und ohne Werte zu leaken.
if (!supabaseUrl || !supabaseAnonKey) {
	console.error(
		'Supabase ist nicht konfiguriert: VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY fehlen (.env).'
	);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		// Opt-in fuer signInWithPasskey()/registerPasskey(). Ohne das Flag wirft das
		// SDK beim Aufruf. Ob der Auth-Server die Endpunkte ueberhaupt kennt, prueft
		// das Auth-Feature (capabilities.ts) zur Laufzeit — der self-hosted GoTrue hier
		// antwortet aktuell mit 404 (siehe HANDOFF.md).
		experimental: { passkey: true }
	}
});
