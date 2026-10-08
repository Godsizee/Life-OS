import { describe, expect, it } from 'vitest';
import { fokusVerlauf } from './timeline';

describe('fokusVerlauf', () => {
	it('fasst Fokuszeit je Tag zusammen, statt je Runde', () => {
		const t = (h: number, min: number) => ({
			started_at: new Date(2026, 6, 31, h).toISOString(),
			duration_min: min,
			source: 'pomodoro' as const
		});
		const r = fokusVerlauf([t(9, 25), t(11, 25)], '2026-07-31', '2026-07-31');
		expect(r).toHaveLength(1);
		expect(r[0].modul).toBe('focus');
		expect(r[0].titel).toContain('50 min');
	});
});
