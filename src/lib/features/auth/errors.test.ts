import { describe, expect, it } from 'vitest';
import { authErrorText } from './errors';

describe('authErrorText', () => {
	it('uebersetzt bekannte GoTrue-Codes', () => {
		expect(authErrorText({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe(
			'E-Mail oder Passwort stimmt nicht.'
		);
		expect(authErrorText({ code: 'email_exists' })).toBe(
			'Für diese E-Mail-Adresse gibt es bereits ein Konto.'
		);
	});

	it('uebersetzt WebAuthn-Abbrueche', () => {
		expect(authErrorText({ name: 'NotAllowedError' })).toMatch(/nicht bestätigt/);
		expect(authErrorText({ name: 'InvalidStateError' })).toMatch(/bereits ein Passkey/);
	});

	it('gibt eigene Schema-Meldungen unveraendert weiter', () => {
		expect(authErrorText({ issues: [{ message: 'Mindestens 8 Zeichen.' }] })).toBe(
			'Mindestens 8 Zeichen.'
		);
	});

	it('erkennt Netzwerkfehler', () => {
		expect(authErrorText({ name: 'AuthRetryableFetchError', status: 0 })).toMatch(/Verbindung/);
		expect(authErrorText({ name: 'TypeError', message: 'Failed to fetch' })).toMatch(/Verbindung/);
	});

	it('faellt bei Serverfehlern und Unbekanntem auf verstaendliche Saetze zurueck', () => {
		expect(authErrorText({ status: 503 })).toMatch(/Server/);
		expect(authErrorText({ status: 429 })).toMatch(/Zu viele Versuche/);
		expect(authErrorText({ code: 'gibt_es_nicht' })).toMatch(/nicht geklappt/);
		expect(authErrorText(null)).toMatch(/nicht geklappt/);
		expect(authErrorText('kaputt')).toMatch(/nicht geklappt/);
	});
});
