import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { toastState } from './toast.svelte';

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

	/** Zweiter init() haengte einen zweiten onAuthStateChange-Listener an. */
	private initialisiert = false;

	/**
	 * `loading` MUSS am Ende immer false sein: +layout.svelte zeigt solange
	 * AuthSplash. Wirft getSession() (korrupter Token im localStorage, Storage im
	 * Privatmodus gesperrt), blieb die App sonst dauerhaft im Splash haengen —
	 * ohne Meldung und ohne Ausweg. Ein Fehler heisst hier "keine Sitzung"; der
	 * Guard im Layout leitet dann regulaer auf /login.
	 */
	async init() {
		if (this.initialisiert) return;
		this.initialisiert = true;

		try {
			const { data, error } = await supabase.auth.getSession();
			if (error) throw error;
			this.session = data.session;
		} catch (err) {
			console.error('[auth] Sitzung konnte nicht gelesen werden', err);
			this.session = null;
			// getSession() liest nur den lokalen Speicher, kein Netz — ein Fehler
			// heisst also: der abgelegte Token ist kaputt. Ohne ihn zu entfernen
			// scheitert auch jeder weitere Start an derselben Stelle.
			await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
			toastState.error('Anmeldung konnte nicht geprüft werden — bitte neu anmelden');
		} finally {
			this.loading = false;
		}

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
