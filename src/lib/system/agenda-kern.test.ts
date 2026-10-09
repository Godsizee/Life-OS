import { describe, expect, it, vi } from 'vitest';
import type { AgendaEintrag, ModulManifest } from '#lib/core/modul.js';
import { mitGeplantemPlan, sammleAgendaIn, tagesfenster } from './agenda-kern.js';

const TAG = new Date(2026, 9, 7, 13, 30);
const e = (key: string): AgendaEintrag => ({
	key,
	modul: 'tasks',
	art: 'aufgabe',
	titel: key,
	start: null,
	ende: null,
	dauerMin: null,
	erledigt: false,
	href: '/',
	warum: ''
});

describe('tagesfenster', () => {
	it('baut das Fenster aus zwei Uhrzeiten am gegebenen Tag', () => {
		const f = tagesfenster(TAG, '07:30', '21:00');
		expect(f.beginn).toEqual(new Date(2026, 9, 7, 7, 30));
		expect(f.ende).toEqual(new Date(2026, 9, 7, 21, 0));
	});

	it('fällt bei Ende vor Beginn oder ungültiger Eingabe auf 08:00 bis 20:00', () => {
		for (const [b, en] of [
			['20:00', '08:00'],
			['kaputt', 'auch']
		] as const) {
			const f = tagesfenster(TAG, b, en);
			expect(f.beginn.getHours()).toBe(8);
			expect(f.ende.getHours()).toBe(20);
		}
	});
});

describe('sammleAgendaIn', () => {
	it('sammelt die Beiträge der Module, die eine Agenda haben', () => {
		const module = [
			{ id: 'tasks', agenda: () => [e('a')] },
			{ id: 'notes' },
			{ id: 'habits', agenda: () => [e('b'), e('c')] }
		] as unknown as ModulManifest[];
		expect(sammleAgendaIn(module, TAG).map((x) => x.key)).toEqual(['a', 'b', 'c']);
	});

	it('übersteht ein defektes Modul und behält die anderen Beiträge', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const module = [
			{
				id: 'tasks',
				agenda: () => {
					throw new Error('kaputt');
				}
			},
			{ id: 'habits', agenda: () => [e('b')] }
		] as unknown as ModulManifest[];
		expect(sammleAgendaIn(module, TAG).map((x) => x.key)).toEqual(['b']);
		expect(spy).toHaveBeenCalledOnce();
		spy.mockRestore();
	});
});

describe('mitGeplantemPlan', () => {
	it('ersetzt nur den Trainings-Eintrag', () => {
		const r = mitGeplantemPlan([e('x'), e('fitness:training:2026-10-07')], {
			id: 'p1',
			name: 'Push'
		});
		expect(r[0].titel).toBe('x');
		expect(r[1].titel).toBe('Push starten');
		expect(r[1].href).toBe('/fitness?startPlan=p1');
	});

	it('ändert ohne Plan nichts', () => {
		const liste = [e('fitness:training:2026-10-07')];
		expect(mitGeplantemPlan(liste, null)).toBe(liste);
	});
});
