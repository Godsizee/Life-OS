import { describe, expect, it } from 'vitest';
import { notizenVerlauf } from './timeline';

const notiz = (id: string, tag: number) =>
	({ id, title: id, created_at: new Date(2026, 6, tag).toISOString(), private: false }) as never;

describe('notizenVerlauf', () => {
	it('lässt alles außerhalb des Fensters weg', () => {
		const r = notizenVerlauf(
			[notiz('A', 1), notiz('B', 15), notiz('C', 30)],
			'2026-07-10',
			'2026-07-20'
		);
		expect(r).toHaveLength(1);
		expect(r[0].titel).toContain('B');
		expect(r[0].href).toBe('/notes?note=B');
	});

	it('schließt Randtage ein (inklusiv)', () => {
		expect(
			notizenVerlauf([notiz('A', 10), notiz('B', 20)], '2026-07-10', '2026-07-20')
		).toHaveLength(2);
	});
});
