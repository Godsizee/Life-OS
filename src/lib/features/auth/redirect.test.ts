import { describe, expect, it } from 'vitest';
import { loginUrlFor, safeNextPath } from './redirect';

describe('safeNextPath', () => {
	it('laesst eigene relative Pfade durch', () => {
		expect(safeNextPath('/tasks')).toBe('/tasks');
		expect(safeNextPath('/invite?token=abc')).toBe('/invite?token=abc');
		expect(safeNextPath('/notes#top')).toBe('/notes#top');
	});

	it('faellt ohne Angabe auf das Dashboard zurueck', () => {
		expect(safeNextPath(null)).toBe('/');
		expect(safeNextPath(undefined)).toBe('/');
		expect(safeNextPath('')).toBe('/');
	});

	it('weist absolute URLs ab', () => {
		expect(safeNextPath('https://evil.tld/phish')).toBe('/');
		expect(safeNextPath('javascript:alert(1)')).toBe('/');
		expect(safeNextPath('mailto:a@b.c')).toBe('/');
	});

	it('weist protokollrelative Ziele ab', () => {
		expect(safeNextPath('//evil.tld')).toBe('/');
		expect(safeNextPath('/\\evil.tld')).toBe('/');
		expect(safeNextPath('  //evil.tld  ')).toBe('/');
	});

	it('weist Steuerzeichen ab, die beim URL-Parsen verschwinden', () => {
		expect(safeNextPath('/\t/evil.tld')).toBe('/');
		expect(safeNextPath('/\n/evil.tld')).toBe('/');
		expect(safeNextPath('/a' + String.fromCharCode(0x7f) + 'b')).toBe('/');
	});

	it('verhindert die Schleife zurueck auf Login und Registrierung', () => {
		expect(safeNextPath('/login')).toBe('/');
		expect(safeNextPath('/login?next=%2Flogin')).toBe('/');
		expect(safeNextPath('/register')).toBe('/');
	});

	it('haelt Pfade, die nur mit einem Loop-Pfad beginnen', () => {
		expect(safeNextPath('/logins')).toBe('/logins');
	});

	it('respektiert einen eigenen Fallback', () => {
		expect(safeNextPath('https://evil.tld', '')).toBe('');
	});
});

describe('loginUrlFor', () => {
	it('haengt das Ziel kodiert an', () => {
		expect(loginUrlFor('/invite', '?token=abc')).toBe('/login?next=%2Finvite%3Ftoken%3Dabc');
	});

	it('laesst den Parameter weg, wenn das Ziel selbst der Login ist', () => {
		expect(loginUrlFor('/login', '')).toBe('/login');
	});

	it('haengt expired=1 an, wenn die Sitzung unerwartet weggefallen ist', () => {
		expect(loginUrlFor('/tasks', '', { expired: true })).toBe('/login?next=%2Ftasks&expired=1');
	});

	it('zeigt expired auch ohne next-Ziel', () => {
		expect(loginUrlFor('/login', '', { expired: true })).toBe('/login?expired=1');
	});

	it('laesst expired ohne next-Ziel weg, wenn es nicht gesetzt ist', () => {
		expect(loginUrlFor('/login', '', { expired: false })).toBe('/login');
	});
});
