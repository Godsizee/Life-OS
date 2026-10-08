import { describe, expect, it } from 'vitest';
import { alsBreakdown, scoreBeitrag, verrechne, type ScoreEingabe } from './score';

const e = (modul: ScoreEingabe['modul'], wert: number | null, gewicht: number): ScoreEingabe => ({
	modul,
	label: modul,
	wert,
	gewicht,
	erklaerung: `${modul}-erklaerung`
});

describe('verrechne', () => {
	it('normiert die Gewichte der zählenden Zeilen', () => {
		const r = verrechne([e('tasks', 100, 4), e('habits', 0, 4)], false);
		expect(r.gesamt).toBe(50);
		expect(r.zeilen.map((z) => z.anteil)).toEqual([0.5, 0.5]);
	});

	it('schließt Zeilen ohne Wert aus und normiert die übrigen neu', () => {
		const r = verrechne([e('tasks', 100, 4), e('mood', null, 2), e('habits', 50, 4)], false);
		expect(r.gesamt).toBe(75);
		const mood = r.zeilen.find((z) => z.modul === 'mood')!;
		expect(mood.anteil).toBe(0);
		expect(mood.beitrag).toBe(0);
	});

	it('Gewicht 0 zählt nicht', () => {
		const r = verrechne([e('tasks', 100, 4), e('focus', 0, 0)], false);
		expect(r.gesamt).toBe(100);
	});

	it('fehlendAlsNull zählt fehlende Werte als 0', () => {
		const r = verrechne([e('tasks', 100, 4), e('mood', null, 4)], true);
		expect(r.gesamt).toBe(50);
		expect(r.zeilen[1].wert).toBe(0);
	});

	it('alle null (oder alle Gewicht 0) ergibt gesamt null', () => {
		expect(verrechne([e('tasks', null, 4), e('mood', null, 2)], false).gesamt).toBeNull();
		expect(verrechne([e('tasks', 80, 0)], false).gesamt).toBeNull();
		expect(verrechne([], false).gesamt).toBeNull();
	});

	it('nennt die Version und reicht die Erklärung durch', () => {
		const r = verrechne([e('tasks', 80, 1)], false);
		expect(r.version).toBe(2);
		expect(r.zeilen[0].erklaerung).toBe('tasks-erklaerung');
	});

	it('ein perfekter und ein leerer Tag liefern 100 und 0', () => {
		expect(verrechne([e('tasks', 100, 3), e('habits', 100, 1)], false).gesamt).toBe(100);
		expect(verrechne([e('tasks', 0, 3), e('habits', 0, 1)], false).gesamt).toBe(0);
	});
});

describe('scoreBeitrag', () => {
	it('liefert Wert und Erklärung aus einer Rechnung und begrenzt auf 0–100', () => {
		const b = scoreBeitrag('Test', () => ({ wert: 140, erklaerung: 'x' }));
		expect(b.berechne('2026-10-08')).toBe(100);
		expect(b.erklaerung('2026-10-08')).toBe('x');
		expect(scoreBeitrag('T', () => ({ wert: null, erklaerung: '' })).berechne('d')).toBeNull();
	});
});

describe('alsBreakdown', () => {
	it('speichert Wert je Modul, Gewichte und Version', () => {
		const r = verrechne([e('tasks', 80.4, 4), e('mood', null, 2)], false);
		expect(alsBreakdown(r)).toEqual({
			tasks: 80,
			mood: null,
			_gewichte: { tasks: 4, mood: 2 },
			_version: 2
		});
	});
});
