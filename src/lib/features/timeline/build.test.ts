import { describe, expect, it } from 'vitest';
import { alsAnzeige, groupByDay } from './build';

describe('alsAnzeige', () => {
	it('übersetzt Beiträge der Module in die Anzeigeform', () => {
		const r = alsAnzeige([
			{
				id: 'a',
				modul: 'tasks',
				zeit: '2026-07-31',
				titel: 'Erledigt',
				untertitel: 'x',
				href: '/tasks',
				herkunft: 'automation:sys:foo'
			}
		]);
		expect(r).toEqual([
			{
				id: 'a',
				date: '2026-07-31',
				title: 'Erledigt',
				description: 'x',
				module: 'tasks',
				href: '/tasks',
				herkunft: 'automation:sys:foo'
			}
		]);
	});

	it('lässt Module ohne Filter-Chip weg', () => {
		expect(alsAnzeige([{ id: 'b', modul: 'analytics', zeit: '2026-07-31', titel: 'x' }])).toEqual(
			[]
		);
	});
});

describe('groupByDay', () => {
	it('gruppiert absteigend und behält die Reihenfolge innerhalb des Tages', () => {
		const items = [
			{ id: '1', date: '2026-07-31', title: 'A', module: 'notes' },
			{ id: '2', date: '2026-07-31', title: 'B', module: 'tasks' },
			{ id: '3', date: '2026-07-30', title: 'C', module: 'mood' }
		] as any[];
		const groups = groupByDay(items);
		expect(groups).toHaveLength(2);
		expect(groups[0].date).toBe('2026-07-31');
		expect(groups[0].items).toHaveLength(2);
		expect(groups[1].date).toBe('2026-07-30');
	});

	it('liefert für eine leere Liste ein leeres Array', () => {
		expect(groupByDay([])).toEqual([]);
	});
});
