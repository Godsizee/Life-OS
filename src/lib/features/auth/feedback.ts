/**
 * Entscheidungen der Fehler-Choreografie: WAS nach einem Auth-Fehler passieren soll.
 * Die Uebersetzung in deutschen Text bleibt in errors.ts.
 *
 * Bewusst reine Funktionen: das Projekt testet ausschliesslich Logik ohne Browser,
 * in einer Komponente waere diese Zuordnung nicht abgesichert.
 */

/** Liest den GoTrue-Code per Duck-Typing — analog errors.ts, ohne Bindung an den Supabase-Client. */
export function authErrorCode(error: unknown): string | null {
	if (!error || typeof error !== 'object') return null;
	const code = (error as { code?: unknown }).code;
	return typeof code === 'string' ? code : null;
}

export type ErrorFocus = 'email' | 'password' | 'none';

const EMAIL_CODES = new Set([
	'invalid_credentials',
	'email_not_confirmed',
	'user_not_found',
	'email_address_invalid',
	'email_address_not_authorized',
	'validation_failed'
]);

const PASSWORD_CODES = new Set(['weak_password', 'same_password']);

/**
 * Welches Feld ist schuld? Dorthin springt nach einem Fehler der Fokus, statt den
 * Nutzer die rote Box selbst suchen zu lassen.
 *
 * user_already_exists/email_exists fehlen hier absichtlich: die bekommen einen
 * Ausweg-Link statt eines Feld-Fokus (siehe offersLoginInstead).
 */
export function focusTargetFor(code: string | null): ErrorFocus {
	if (code === null) return 'none';
	if (PASSWORD_CODES.has(code)) return 'password';
	if (EMAIL_CODES.has(code)) return 'email';
	return 'none';
}

/**
 * Bei diesen Codes ist die Registrierung keine Sackgasse, sondern ein Wegweiser:
 * das Konto existiert bereits, der Nutzer muss sich nur anmelden.
 */
export function offersLoginInstead(code: string | null): boolean {
	return code === 'user_already_exists' || code === 'email_exists';
}
