import { describe, expect, it } from 'vitest';
import { authErrorCode, focusTargetFor, offersLoginInstead } from './feedback';

describe('authErrorCode', () => {
	it('liest den Code aus einem GoTrue-Fehler', () => {
		expect(authErrorCode({ code: 'user_already_exists', status: 422 })).toBe('user_already_exists');
	});

	it('liefert null ohne verwertbaren Code', () => {
		expect(authErrorCode(null)).toBeNull();
		expect(authErrorCode('kaputt')).toBeNull();
		expect(authErrorCode(new Error('netzwerk'))).toBeNull();
		expect(authErrorCode({ code: 42 })).toBeNull();
	});
});

describe('focusTargetFor', () => {
	it('schickt Anmeldefehler zurueck ins E-Mail-Feld', () => {
		expect(focusTargetFor('invalid_credentials')).toBe('email');
		expect(focusTargetFor('user_not_found')).toBe('email');
		expect(focusTargetFor('email_not_confirmed')).toBe('email');
	});

	it('schickt Passwortfehler ins Passwortfeld', () => {
		expect(focusTargetFor('weak_password')).toBe('password');
		expect(focusTargetFor('same_password')).toBe('password');
	});

	it('laesst den Fokus bei unspezifischen Fehlern stehen', () => {
		expect(focusTargetFor(null)).toBe('none');
		expect(focusTargetFor('over_request_rate_limit')).toBe('none');
		expect(focusTargetFor('signup_disabled')).toBe('none');
	});

	it('ueberlaesst bestehende Konten dem Anmelden-Ausweg', () => {
		expect(focusTargetFor('user_already_exists')).toBe('none');
		expect(focusTargetFor('email_exists')).toBe('none');
	});
});

describe('offersLoginInstead', () => {
	it('erkennt bereits existierende Konten', () => {
		expect(offersLoginInstead('user_already_exists')).toBe(true);
		expect(offersLoginInstead('email_exists')).toBe(true);
	});

	it('gilt nicht fuer andere Fehler', () => {
		expect(offersLoginInstead('invalid_credentials')).toBe(false);
		expect(offersLoginInstead(null)).toBe(false);
	});
});
