import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

class AuthState {
	session = $state<Session | null>(null);
	loading = $state(true);

	user = $derived<User | null>(this.session?.user ?? null);

	async init() {
		const { data } = await supabase.auth.getSession();
		this.session = data.session;
		this.loading = false;

		supabase.auth.onAuthStateChange((_event, session) => {
			this.session = session;
		});
	}
}

// Abmelden liegt bewusst nicht hier, sondern in features/auth/logout.ts:
// es muss zusaetzlich Workspace-Daten und Outbox aufraeumen, und core darf
// nicht auf features zugreifen.

export const authState = new AuthState();
