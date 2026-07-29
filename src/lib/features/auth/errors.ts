/**
 * Supabase/GoTrue liefert englische Rohmeldungen ("Invalid login credentials").
 * Hier einmal zentral nach Deutsch übersetzt, damit kein Aufrufer sie durchreicht.
 *
 * Absichtlich per Duck-Typing statt `instanceof AuthError`: so hängt das Modul
 * nicht am Supabase-Client und bleibt ohne Browser-Umgebung testbar.
 */

const BY_CODE: Record<string, string> = {
	invalid_credentials: 'E-Mail oder Passwort stimmt nicht.',
	email_not_confirmed: 'Diese E-Mail-Adresse ist noch nicht bestätigt.',
	email_exists: 'Für diese E-Mail-Adresse gibt es bereits ein Konto.',
	user_already_exists: 'Für diese E-Mail-Adresse gibt es bereits ein Konto.',
	weak_password: 'Das Passwort ist zu schwach — länger und mit Zahl oder Sonderzeichen.',
	same_password: 'Das ist das bisherige Passwort.',
	user_not_found: 'Zu diesen Daten gibt es kein Konto.',
	user_banned: 'Dieses Konto ist gesperrt.',
	session_expired: 'Die Sitzung ist abgelaufen. Bitte erneut anmelden.',
	signup_disabled: 'Auf diesem Server ist die Registrierung abgeschaltet.',
	email_provider_disabled: 'Auf diesem Server ist die Anmeldung per E-Mail abgeschaltet.',
	email_address_invalid: 'Diese E-Mail-Adresse akzeptiert der Server nicht.',
	email_address_not_authorized: 'An diese E-Mail-Adresse darf der Server nicht senden.',
	over_request_rate_limit: 'Zu viele Versuche. Bitte einen Moment warten.',
	over_email_send_rate_limit: 'Zu viele E-Mails in kurzer Zeit. Bitte einen Moment warten.',
	validation_failed: 'Die Eingaben sind unvollständig oder ungültig.',
	request_timeout: 'Der Server hat zu lange gebraucht. Bitte erneut versuchen.',
	captcha_failed: 'Die Sicherheitsprüfung ist fehlgeschlagen. Bitte erneut versuchen.'
};

/** WebAuthn meldet Abbrüche als DOMException — für Nutzer sonst völlig kryptisch. */
const BY_DOM_EXCEPTION: Record<string, string> = {
	NotAllowedError: 'Der Passkey wurde nicht bestätigt oder die Zeit lief ab.',
	InvalidStateError: 'Für dieses Gerät ist bereits ein Passkey hinterlegt.',
	SecurityError: 'Passkeys sind für diese Adresse nicht freigegeben.',
	AbortError: 'Der Vorgang wurde abgebrochen.',
	NotSupportedError: 'Dieses Gerät unterstützt keine Passkeys.'
};

const NETWORK = 'Keine Verbindung zum Server. Prüfe deine Internetverbindung.';
const FALLBACK = 'Das hat leider nicht geklappt. Bitte später erneut versuchen.';

interface ErrorLike {
	name?: unknown;
	code?: unknown;
	status?: unknown;
	message?: unknown;
	issues?: unknown;
}

function firstZodIssue(error: ErrorLike): string | null {
	if (!Array.isArray(error.issues) || error.issues.length === 0) return null;
	const message = (error.issues[0] as { message?: unknown }).message;
	return typeof message === 'string' ? message : null;
}

/** Übersetzt einen beliebigen Fehler aus dem Auth-Flow in einen anzeigbaren Satz. */
export function authErrorText(error: unknown): string {
	if (!error || typeof error !== 'object') return FALLBACK;
	const e = error as ErrorLike;

	// Eigene Schema-Verstöße tragen bereits deutsche Texte.
	const zodMessage = firstZodIssue(e);
	if (zodMessage) return zodMessage;

	if (typeof e.name === 'string' && e.name in BY_DOM_EXCEPTION) return BY_DOM_EXCEPTION[e.name];
	if (typeof e.code === 'string' && e.code in BY_CODE) return BY_CODE[e.code];

	// AuthRetryableFetchError kommt ohne Code; status 0 heißt "gar nicht erst rausgegangen".
	if (e.name === 'AuthRetryableFetchError' || e.status === 0) return NETWORK;
	if (e.name === 'TypeError' && typeof e.message === 'string' && /fetch/i.test(e.message)) {
		return NETWORK;
	}

	if (e.status === 429) return BY_CODE.over_request_rate_limit;
	if (typeof e.status === 'number' && e.status >= 500) {
		return 'Der Server hat einen Fehler gemeldet. Bitte später erneut versuchen.';
	}

	return FALLBACK;
}
