import { describe, expect, it } from 'vitest';
import { aufgabenVerlauf } from './timeline';

const aufgabe = (status: string, completed: string | null) =>
	({
		id: 't1',
		title: 'Test',
		status,
		completed_at: completed,
		updated_at: completed ?? ''
	}) as never;

describe('aufgabenVerlauf', () => {
	it('nutzt das LOKALE Datum, nicht UTC', () => {
		const spaet = new Date(2026, 6, 31, 23, 45).toISOString();
		const r = aufgabenVerlauf([aufgabe('done', spaet)], '2026-07-01', '2026-07-31');
		expect(r[0].zeit).toBe('2026-07-31');
		expect(r[0].href).toBe('/tasks?task=t1');
	});

	it('zeigt weder offene noch verworfene Aufgaben', () => {
		const t = new Date(2026, 6, 15, 12).toISOString();
		expect(
			aufgabenVerlauf([aufgabe('todo', null), aufgabe('dropped', t)], '2026-07-01', '2026-07-31')
		).toEqual([]);
	});

	it('schließt Randtage ein und lässt Außerhalb weg', () => {
		const tag = (d: number) => aufgabe('done', new Date(2026, 6, d, 12).toISOString());
		const r = aufgabenVerlauf([tag(9), tag(10), tag(20), tag(21)], '2026-07-10', '2026-07-20');
		expect(r.map((e) => e.zeit)).toEqual(['2026-07-10', '2026-07-20']);
	});
});
