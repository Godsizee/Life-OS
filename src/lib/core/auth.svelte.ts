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

	async signOut() {
		await supabase.auth.signOut();
	}
}

export const authState = new AuthState();
