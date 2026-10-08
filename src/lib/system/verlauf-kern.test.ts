import { describe, expect, it, vi } from 'vitest';
import { sammleVerlaufIn } from './verlauf-kern';

const eintrag = (id: string, zeit: string) => ({ id, modul: 'tasks' as const, zeit, titel: id });
const von = new Date(2026, 6, 1);
const bis = new Date(2026, 6, 31);

describe('sammleVerlaufIn', () => {
	it('fügt die Beiträge zusammen, neueste zuerst', () => {
		const r = sammleVerlaufIn(
			[
				{ id: 'tasks', timeline: () => [eintrag('a', '2026-07-01'), eintrag('b', '2026-07-20')] },
				{ id: 'notes', timeline: () => [eintrag('c', '2026-07-10')] },
				{ id: 'timeline' }
			],
			von,
			bis
		);
		expect(r.map((e) => e.id)).toEqual(['b', 'c', 'a']);
	});

	it('gibt das Fenster an die Module weiter', () => {
		const timeline = vi.fn(() => []);
		sammleVerlaufIn([{ id: 'tasks', timeline }], von, bis);
		expect(timeline).toHaveBeenCalledWith(von, bis);
	});

	it('ein werfender Beitrag verdeckt die übrigen nicht', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const r = sammleVerlaufIn(
			[
				{
					id: 'tasks',
					timeline: () => {
						throw new Error('kaputt');
					}
				},
				{ id: 'notes', timeline: () => [eintrag('c', '2026-07-10')] }
			],
			von,
			bis
		);
		expect(r).toHaveLength(1);
	});
});
