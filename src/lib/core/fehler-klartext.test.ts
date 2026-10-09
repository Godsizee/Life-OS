import { describe, expect, it } from 'vitest';
import { fehlerCode, fehlerKlartext } from './fehler-klartext.js';

describe('fehlerKlartext', () => {
	it.each([
		['23505', 'Gibt es schon — vermutlich auf einem anderen Gerät angelegt.'],
		['23503', 'Der Bezug existiert nicht mehr — wurde wohl gelöscht.'],
		['23502', 'Ein Pflichtfeld fehlt oder ein Wert ist ungültig.'],
		['23514', 'Ein Pflichtfeld fehlt oder ein Wert ist ungültig.'],
		['42501', 'Keine Berechtigung — z. B. privater Eintrag einer anderen Person.'],
		['PGRST204', 'App und Server passen nicht zusammen — App neu laden.']
	])('übersetzt %s', (code, text) => {
		expect(fehlerKlartext(code)).toEqual({ text, technischZeigen: false });
	});

	it('bleibt bei unbekanntem oder fehlendem Code neutral und zeigt den technischen Text', () => {
		const neutral = { text: 'Konnte nicht gespeichert werden.', technischZeigen: true };
		expect(fehlerKlartext('99999')).toEqual(neutral);
		expect(fehlerKlartext(undefined)).toEqual(neutral);
	});
});

describe('fehlerCode', () => {
	it('liest den Code aus Fehlerobjekten und ignoriert alles andere', () => {
		expect(fehlerCode({ code: '23505', message: 'x' })).toBe('23505');
		expect(fehlerCode(new Error('x'))).toBeUndefined();
		expect(fehlerCode({ code: 42 })).toBeUndefined();
		expect(fehlerCode({ code: '' })).toBeUndefined();
		expect(fehlerCode(null)).toBeUndefined();
	});
});
