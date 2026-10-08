import { describe, expect, it } from 'vitest';
import { serieOffen } from './hinweise';
import { routinenKontext, routinenScore } from './tag';

const ABEND = new Date(2026, 9, 8, 19, 0);
const iso = (tageZurueck: number, basis = ABEND) => {
	const d = new Date(basis);
	d.setDate(d.getDate() - tageZurueck);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const taeglich = {
	id: 'h1',
	name: 'Lesen',
	archived: false,
	schedule: { type: 'daily' as const },
	target_value: null,
	unit: null
};
/** Häkchen an den letzten `n` Tagen — heute bewusst offen. */
const serie = (n: number) =>
	Array.from({ length: n }, (_, i) => ({ date: iso(i + 1), value: 1, status: 'done' as const }));
const tage = (map: Record<string, ReturnType<typeof serie>>) => (id: string) => map[id] ?? [];

describe('habits.serie-offen', () => {
	it('warnt, wenn eine laufende Serie heute noch offen ist', () => {
		const r = serieOffen([taeglich], tage({ h1: serie(5) }), ABEND, '18:00');
		expect(r).toHaveLength(1);
		expect(r[0].id).toBe('habits.serie-offen:h1');
		expect(r[0].text).toContain('5 Tage');
		expect(r[0].prioritaet).toBeGreaterThanOrEqual(50);
	});

	it('wartet bis zur Abendzeit', () => {
		const mittag = new Date(2026, 9, 8, 12, 0);
		expect(serieOffen([taeglich], tage({ h1: serie(5) }), mittag, '18:00')).toEqual([]);
		expect(serieOffen([taeglich], tage({ h1: serie(5) }), mittag, '11:00')).toHaveLength(1);
	});

	it('schweigt, wenn heute schon abgehakt ist', () => {
		const heute = [{ date: iso(0), value: 1, status: 'done' as const }, ...serie(5)];
		expect(serieOffen([taeglich], tage({ h1: heute }), ABEND, '18:00')).toEqual([]);
	});

	it('schweigt bei kurzer Serie — da ist wenig zu verlieren', () => {
		expect(serieOffen([taeglich], tage({ h1: serie(2) }), ABEND, '18:00')).toEqual([]);
		expect(serieOffen([taeglich], tage({ h1: [] }), ABEND, '18:00')).toEqual([]);
	});

	it('lässt archivierte Routinen aus', () => {
		expect(
			serieOffen([{ ...taeglich, archived: true }], tage({ h1: serie(5) }), ABEND, '18:00')
		).toEqual([]);
	});
});

describe('Routinen-Score und Kontext', () => {
	const TAG = '2026-10-08';
	it('ohne fällige Routine null statt 100', () => {
		expect(routinenScore([], () => [], TAG).wert).toBeNull();
	});
	it('zählt erledigte gegen fällige, übersprungene fallen heraus', () => {
		const zwei = { ...taeglich, id: 'h2', name: 'Sport' };
		const drei = { ...taeglich, id: 'h3', name: 'Yoga' };
		const t = tage({
			h1: [{ date: TAG, value: 1, status: 'done' as const }],
			h2: [],
			h3: [{ date: TAG, value: 0, status: 'skipped' as never }]
		});
		expect(routinenScore([taeglich, zwei, drei], t, TAG).wert).toBe(50);
		expect(routinenKontext([taeglich, zwei, drei], t, TAG)).toEqual({
			habits_logged: 1,
			habits_due: 2
		});
	});
	it('ungültiges Datum liefert nichts statt zu rechnen (Falle F8)', () => {
		expect(routinenScore([taeglich], () => [], 'kaputt').wert).toBeNull();
	});
});
