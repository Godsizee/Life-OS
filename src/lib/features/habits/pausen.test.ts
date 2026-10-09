import { describe, expect, it } from 'vitest';
import { mitPausen } from './pausen';
import { calculateStreak, type HabitDay } from './streak';

const taeglich = { schedule: { type: 'daily' as const }, target_value: null };
const erledigt = (date: string): HabitDay => ({ date, value: 1, status: 'done' });

describe('mitPausen', () => {
	it('füllt eine Pause über 3 Tage ohne Einträge mit 3 Skips', () => {
		const r = mitPausen([], [{ von: '2026-10-01', bis: '2026-10-03', grund: 'urlaub' }]);
		expect(r.map((t) => [t.date, t.status])).toEqual([
			['2026-10-01', 'skipped'],
			['2026-10-02', 'skipped'],
			['2026-10-03', 'skipped']
		]);
	});

	it('lässt echte Einträge am Pausentag unverändert', () => {
		const tage = [erledigt('2026-10-02')];
		const r = mitPausen(tage, [{ von: '2026-10-01', bis: '2026-10-03', grund: 'krank' }]);
		expect(r.find((t) => t.date === '2026-10-02')?.status).toBe('done');
		expect(r).toHaveLength(3);
	});

	it('ignoriert eine Pause mit von nach bis und gibt dieselbe Liste zurück', () => {
		const tage = [erledigt('2026-10-02')];
		expect(mitPausen(tage, [{ von: '2026-10-05', bis: '2026-10-01', grund: 'sonstiges' }])).toBe(
			tage
		);
		expect(mitPausen(tage, [])).toBe(tage);
	});

	it('behandelt überlappende Pausen ohne doppelte Tage', () => {
		const r = mitPausen(
			[],
			[
				{ von: '2026-10-01', bis: '2026-10-03', grund: 'urlaub' },
				{ von: '2026-10-03', bis: '2026-10-04', grund: 'krank' }
			]
		);
		expect(r.map((t) => t.date)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
	});

	it('hält eine Serie über eine Urlaubswoche', () => {
		const heute = new Date(2026, 9, 10);
		const vorher = ['2026-09-30', '2026-10-01'].map(erledigt);
		const nachher = ['2026-10-09', '2026-10-10'].map(erledigt);
		const ohne = calculateStreak(taeglich, [...vorher, ...nachher], heute);
		const mit = calculateStreak(
			taeglich,
			mitPausen(
				[...vorher, ...nachher],
				[{ von: '2026-10-02', bis: '2026-10-08', grund: 'urlaub' }]
			),
			heute
		);
		expect(ohne).toBe(2);
		expect(mit).toBe(4);
	});
});
