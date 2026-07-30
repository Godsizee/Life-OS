import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

class AuthState {
	session = $state<Session | null>(null);
	loading = $state(true);

	user = $derived<User | null>(this.session?.user ?? null);

	/**
	 * Von logout() gesetzt, bevor signOut() feuert. `onAuthStateChange` liefert
	 * fuer eine gewollte Abmeldung und eine serverseitig abgelaufene Sitzung
	 * denselben SIGNED_OUT-Event — der Guard in +layout.svelte braucht dieses
	 * Flag, um beide Faelle auseinanderzuhalten und nur beim zweiten einen
	 * "Sitzung abgelaufen"-Hinweis zu zeigen.
	 */
	private expectingSignOut = false;

	async init() {
		const { data } = await supabase.auth.getSession();
		this.session = data.session;
		this.loading = false;

		supabase.auth.onAuthStateChange((_event, session) => {
			this.session = session;
		});
	}

	markIntentionalSignOut() {
		this.expectingSignOut = true;
	}

	/** Liest das Flag und setzt es zurueck — darf pro Abmeldung nur einmal greifen. */
	consumeIntentionalSignOut(): boolean {
		const was = this.expectingSignOut;
		this.expectingSignOut = false;
		return was;
	}
}

// Abmelden liegt bewusst nicht hier, sondern in features/auth/logout.ts:
// es muss zusaetzlich Workspace-Daten und Outbox aufraeumen, und core darf
// nicht auf features zugreifen.

export const authState = new AuthState();
