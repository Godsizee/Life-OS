import { beforeEach, describe, expect, it } from 'vitest';
import { registriereSpeicher, wert } from '#lib/core/einstellungen.js';
import {
	automationAlle,
	leseUeberschreibung,
	leseUeberschreibungen,
	loescheUeberschreibung,
	setzeUeberschreibung
} from './einstellungen.js';
import { REGELN } from './regeln.js';

let werte: Record<string, unknown>;

beforeEach(() => {
	werte = {};
	registriereSpeicher('nutzer', {
		lesen: (k) => werte[k],
		schreiben: async (patch) => {
			werte = { ...werte, ...patch };
		}
	});
});

describe('Automationen-Einstellungen', () => {
	it('Hauptschalter ist standardmäßig an', () => {
		expect(wert(automationAlle)).toBe(true);
		werte['automation.alle'] = false;
		expect(wert(automationAlle)).toBe(false);
	});

	it('liefert ohne Eintrag eine leere Überschreibung für jede Regel', () => {
		const alle = leseUeberschreibungen(REGELN);
		expect(Object.keys(alle)).toHaveLength(REGELN.length);
		expect(alle['sys:training-routine']).toEqual({});
	});

	it('speichert unter dem flachen Schlüssel automation.<regelId>', async () => {
		await setzeUeberschreibung('sys:training-routine', { aktiv: false });
		expect(werte['automation.sys:training-routine']).toEqual({ aktiv: false });
	});

	it('führt Felder und Parameter zusammen statt sie zu ersetzen', async () => {
		await setzeUeberschreibung('sys:wasser-routine', { parameter: { habitId: 'h1' } });
		await setzeUeberschreibung('sys:wasser-routine', { parameter: { mlProEinheit: 300 } });
		await setzeUeberschreibung('sys:wasser-routine', { modus: 'fragen' });
		expect(leseUeberschreibung('sys:wasser-routine')).toEqual({
			modus: 'fragen',
			parameter: { habitId: 'h1', mlProEinheit: 300 }
		});
	});

	it('fällt bei kaputten Werten auf eine leere Überschreibung zurück', () => {
		werte['automation.sys:training-routine'] = { modus: 'kaputt' };
		expect(leseUeberschreibung('sys:training-routine')).toEqual({});
	});

	it('setzt eine Regel auf ihre Standardwerte zurück', async () => {
		await setzeUeberschreibung('sys:training-routine', { aktiv: false });
		await loescheUeberschreibung('sys:training-routine');
		expect(leseUeberschreibung('sys:training-routine')).toEqual({});
	});
});
