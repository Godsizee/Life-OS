import { describe, expect, it } from 'vitest';
import { erinnerungenAgenda } from './agenda.js';

const TAG = new Date(2026, 9, 7, 12, 0);
const r = (id: string, typ: 'custom' | 'task', h: number, tag = 7) => ({
	id,
	title: `Erinnerung ${id}`,
	remind_at: new Date(2026, 9, tag, h).toISOString(),
	url: '/',
	entity_type: typ
});

describe('erinnerungenAgenda', () => {
	it('nimmt eigene Erinnerungen des Tages mit Uhrzeit', () => {
		const [e] = erinnerungenAgenda([r('a', 'custom', 15)], TAG);
		expect(e.art).toBe('erinnerung');
		expect(e.start?.getHours()).toBe(15);
		expect(e.warum).toBe('Erinnerung');
	});

	it('lässt Erinnerungen an Aufgaben und andere Tage weg', () => {
		expect(erinnerungenAgenda([r('a', 'task', 15), r('b', 'custom', 9, 8)], TAG)).toEqual([]);
	});
});
