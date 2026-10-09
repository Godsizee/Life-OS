import { describe, expect, it } from 'vitest';
import { routinenAgenda } from './agenda.js';
import type { HabitDay } from './streak.js';

const TAG = new Date(2026, 9, 7, 12, 0); // Mittwoch
const taeglich = {
	id: 'h1',
	name: 'Lesen',
	schedule: { type: 'daily' as const },
	target_value: null
};
const nurMoFr = {
	id: 'h2',
	name: 'Sport',
	schedule: { type: 'weekly' as const, days: [1, 5] },
	target_value: null
};
const erledigtHeute: HabitDay[] = [{ date: '2026-10-07', value: 1, status: 'done' }];
const leer = () => [] as HabitDay[];

describe('routinenAgenda', () => {
	it('listet fällige Routinen als flexible Einträge mit Rhythmus-Text', () => {
		const [e] = routinenAgenda([taeglich], leer, TAG);
		expect(e.art).toBe('routine');
		expect(e.start).toBeNull();
		expect(e.erledigt).toBe(false);
		expect(e.warum).toBe('Routine: Täglich');
	});

	it('zeigt erledigte Routinen als erledigt', () => {
		const [e] = routinenAgenda([taeglich], () => erledigtHeute, TAG);
		expect(e.erledigt).toBe(true);
	});

	it('lässt Routinen weg, die heute nicht fällig sind', () => {
		expect(routinenAgenda([nurMoFr], leer, TAG)).toEqual([]);
	});

	it('lässt übersprungene und archivierte Routinen weg', () => {
		const uebersprungen: HabitDay[] = [{ date: '2026-10-07', value: 0, status: 'skipped' }];
		expect(routinenAgenda([taeglich], () => uebersprungen, TAG)).toEqual([]);
		expect(routinenAgenda([{ ...taeglich, archived: true }], leer, TAG)).toEqual([]);
	});
});
