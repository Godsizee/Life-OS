import { describe, expect, it } from 'vitest';
import { RUECKBLICK_KOPF, rueckblickAnhaengen } from './rueckblick.js';

describe('rueckblickAnhaengen', () => {
	it('hängt den Rückblick mit Leerzeile an einen vorhandenen Text', () => {
		expect(rueckblickAnhaengen('Guter Tag.', ['Steuer', 'Einkauf'])).toBe(
			'Guter Tag.\n\n**Erledigt heute:**\n- Steuer\n- Einkauf'
		);
	});

	it('legt bei leerem Text den Block ohne führende Leerzeilen an', () => {
		expect(rueckblickAnhaengen('', ['Steuer'])).toBe('**Erledigt heute:**\n- Steuer');
		expect(rueckblickAnhaengen('  \n ', ['Steuer'])).toBe('**Erledigt heute:**\n- Steuer');
	});

	it('entfernt Leerraum am Ende des alten Textes', () => {
		expect(rueckblickAnhaengen('Text\n\n\n', ['A'])).toBe('Text\n\n**Erledigt heute:**\n- A');
	});

	it('ist idempotent: ein vorhandener Rückblick wird nicht verdoppelt', () => {
		const einmal = rueckblickAnhaengen('Text', ['A']);
		expect(einmal).toContain(RUECKBLICK_KOPF);
		expect(rueckblickAnhaengen(einmal!, ['A', 'B'])).toBeNull();
	});

	it('liefert null ohne verwertbare Aufgaben', () => {
		expect(rueckblickAnhaengen('Text', [])).toBeNull();
		expect(rueckblickAnhaengen('Text', ['  ', '\n'])).toBeNull();
	});

	it('bringt mehrzeilige Titel auf eine Zeile', () => {
		expect(rueckblickAnhaengen('', ['Zeile 1\nZeile 2'])).toBe(
			'**Erledigt heute:**\n- Zeile 1 Zeile 2'
		);
	});
});
