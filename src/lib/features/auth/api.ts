import type { Session } from '@supabase/supabase-js';
import { supabase } from '$lib/core/supabase';
import { passkeyAvailable } from './capabilities';
import { credentialsSchema, loginCredentialsSchema } from './schema';

/**
 * Einziger Ort im Projekt, der `supabase.auth` berührt (AGENTS.md: UI spricht
 * nie direkt mit dem Client). `core/auth.svelte.ts` bleibt daneben bestehen und
 * hält nur die Session — dieser Slice sitzt davor, nicht darüber.
 */

export async function signInWithPassword(email: string, password: string): Promise<Session> {
	const credentials = loginCredentialsSchema.parse({ email: email.trim(), password });
	const { data, error } = await supabase.auth.signInWithPassword(credentials);
	if (error) throw error;
	if (!data.session) throw new Error('Anmeldung ohne Sitzung zurückgekommen.');
	return data.session;
}

export interface SignUpResult {
	session: Session | null;
	/** true, wenn der Server auf eine Bestätigungsmail wartet (mailer_autoconfirm=false). */
	needsConfirmation: boolean;
}

export async function signUpWithPassword(email: string, password: string): Promise<SignUpResult> {
	const credentials = credentialsSchema.parse({ email: email.trim(), password });
	const { data, error } = await supabase.auth.signUp(credentials);
	if (error) throw error;
	return { session: data.session, needsConfirmation: data.session === null };
}

export async function signOut(): Promise<void> {
	// scope: 'global' (SDK-Default) meldet auf allen Geraeten ab, an denen dieses
	// Konto eingeloggt ist. Fuer einen "Abmelden"-Knopf ist 'local' das erwartete
	// Verhalten — sonst wirft ein Logout am Handy die Desktop-Sitzung mit raus.
	const { error } = await supabase.auth.signOut({ scope: 'local' });
	if (error) throw error;
}

/**
 * Passkey-Wege sind absichtlich hinter der Fähigkeitsprüfung verriegelt: Ohne
 * sie wirft das SDK bei abgeschaltetem Flag bzw. der Server 404, und der Nutzer
 * sähe einen Fehler für einen Knopf, der nie hätte erscheinen dürfen.
 */
async function assertPasskeySupport(): Promise<void> {
	if (!(await passkeyAvailable())) {
		throw new Error('Passkeys sind auf diesem Gerät oder Server nicht verfügbar.');
	}
}

export async function signInWithPasskey(): Promise<Session> {
	await assertPasskeySupport();
	const { data, error } = await supabase.auth.signInWithPasskey();
	if (error) throw error;
	if (!data.session) throw new Error('Anmeldung ohne Sitzung zurückgekommen.');
	return data.session;
}

export async function registerPasskey(): Promise<void> {
	await assertPasskeySupport();
	const { error } = await supabase.auth.registerPasskey();
	if (error) throw error;
}
