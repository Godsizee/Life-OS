import { describe, expect, it, vi } from 'vitest';
import * as z from 'zod/mini';
import {
	defineEinstellung,
	registriereSpeicher,
	setze,
	wert,
	zuruecksetzen,
	type EinstellungDef
} from './einstellungen';
import { erstelleRegister } from './register';

const def = defineEinstellung({
	schluessel: 'heute.tagesbeginn',
	ablage: 'geraet',
	schema: z.string().check(z.regex(/^\d{2}:\d{2}$/)),
	standard: '08:00',
	label: 'Tagesbeginn',
	stufe: 'modul',
	abschnitt: 'heute',
	ui: { art: 'zeit' }
});

describe('Einstellungs-Kern', () => {
	it('fällt bei fehlendem oder ungültigem Wert auf den Standard zurück', () => {
		const daten: Record<string, unknown> = {};
		registriereSpeicher('geraet', { lesen: (k) => daten[k], schreiben: async () => {} });
		expect(wert(def)).toBe('08:00');
		daten['heute.tagesbeginn'] = 'kaputt';
		expect(wert(def)).toBe('08:00');
		daten['heute.tagesbeginn'] = '07:30';
		expect(wert(def)).toBe('07:30');
	});

	it('setze() prüft und schreibt einen flachen Schlüssel', async () => {
		const schreiben = vi.fn(async () => {});
		registriereSpeicher('geraet', { lesen: () => undefined, schreiben });
		await setze(def, '06:45');
		expect(schreiben).toHaveBeenCalledWith({ 'heute.tagesbeginn': '06:45' });
		await expect(setze(def, '6 Uhr')).rejects.toThrow();
	});
});

describe('Einstellungs-Kern: Randfälle', () => {
	const zahl = defineEinstellung({
		schluessel: 'heute.limit',
		ablage: 'nutzer',
		schema: z.int().check(z.minimum(1), z.maximum(10)),
		standard: 5,
		label: 'Limit',
		stufe: 'modul',
		abschnitt: 'heute',
		ui: { art: 'zahl', min: 1, max: 10, schritt: 1 }
	});

	it('wert() liefert den Standard bei null und bei schemawidrigem Wert', () => {
		const daten: Record<string, unknown> = { 'heute.limit': null };
		registriereSpeicher('nutzer', { lesen: (k) => daten[k], schreiben: async () => {} });
		expect(wert(zahl)).toBe(5);
		daten['heute.limit'] = 'abc';
		expect(wert(zahl)).toBe(5);
		daten['heute.limit'] = 99;
		expect(wert(zahl)).toBe(5);
		daten['heute.limit'] = 7;
		expect(wert(zahl)).toBe(7);
	});

	it('setze() schreibt bei ungültigem Wert nichts', async () => {
		const schreiben = vi.fn(async () => {});
		registriereSpeicher('nutzer', { lesen: () => undefined, schreiben });
		await expect(setze(zahl, 0)).rejects.toThrow();
		expect(schreiben).not.toHaveBeenCalled();
	});

	it('zuruecksetzen() schreibt alle Standards', async () => {
		const schreiben = vi.fn(async () => {});
		registriereSpeicher('nutzer', { lesen: () => undefined, schreiben });
		registriereSpeicher('geraet', { lesen: () => undefined, schreiben });
		await zuruecksetzen([zahl, def] as EinstellungDef<unknown>[]);
		expect(schreiben).toHaveBeenCalledWith({ 'heute.limit': 5 });
		expect(schreiben).toHaveBeenCalledWith({ 'heute.tagesbeginn': '08:00' });
	});
});

describe('Register', () => {
	it('setzt, holt, listet und leert', () => {
		const r = erstelleRegister<number>('test');
		r.setze('a', 1);
		r.setze('b', 2);
		expect(r.hole('a')).toBe(1);
		expect(r.alle()).toEqual([1, 2]);
		r.leeren();
		expect(r.hole('a')).toBeUndefined();
	});
});
