import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { defineEinstellung, registriereSpeicher, setze, wert } from './einstellungen';
import { erstelleRegister } from './register';

const def = defineEinstellung({
	schluessel: 'heute.tagesbeginn',
	ablage: 'geraet',
	schema: z.string().regex(/^\d{2}:\d{2}$/),
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
