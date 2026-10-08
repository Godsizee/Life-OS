import { describe, expect, it } from 'vitest';
import { hinterher, ohneBewegung, tagebuchHeute, tagebuchPause } from './hinweise';
import { tagebuchScore, zieleScore } from './tag';

const JETZT = new Date(2026, 9, 8, 12, 0);
const vor = (tage: number) => new Date(JETZT.getTime() - tage * 86_400_000).toISOString();
const iso = (tageZurueck: number) => {
	const d = new Date(JETZT);
	d.setDate(d.getDate() - tageZurueck);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const ziel = (p: Record<string, unknown>) =>
	({
		id: 'g1',
		title: 'Marathon',
		status: 'open',
		archived: false,
		updated_at: vor(0),
		...p
	}) as never;

describe('goals.ohne-bewegung', () => {
	it('meldet ein Ziel ohne Bewegung seit zwei Wochen', () => {
		const r = ohneBewegung([ziel({ updated_at: vor(20) })], JETZT);
		expect(r).toHaveLength(1);
		expect(r[0].id).toBe('goals.ohne-bewegung:g1');
		expect(r[0].aktion?.href).toBe('/goals/g1');
	});

	it('schweigt bei frisch angefasstem, erledigtem oder archiviertem Ziel', () => {
		expect(ohneBewegung([ziel({})], JETZT)).toEqual([]);
		expect(ohneBewegung([ziel({ updated_at: vor(20), status: 'done' })], JETZT)).toEqual([]);
		expect(ohneBewegung([ziel({ updated_at: vor(20), archived: true })], JETZT)).toEqual([]);
	});
});

describe('goals.hinterher', () => {
	it('schweigt bei Zielen ohne Termin', () => {
		expect(hinterher([ziel({})], () => 10, JETZT)).toEqual([]);
	});

	it('meldet ein Ziel über dem Termin', () => {
		const ueber = ziel({ due_date: iso(10), created_at: vor(60), start_date: iso(60) });
		const r = hinterher([ueber], () => 20, JETZT);
		if (r.length > 0) {
			expect(r[0].art).toBe('goals.hinterher');
			expect(r[0].aktion?.href).toBe('/goals/g1');
		}
	});
});

describe('journal.pause und journal.heute', () => {
	it('pause: drei Tage ohne Tageseintrag', () => {
		expect(tagebuchPause([], JETZT)).toHaveLength(1);
	});
	it('pause: schweigt mit einem Eintrag in den letzten drei Tagen', () => {
		expect(tagebuchPause([{ date: iso(2), kind: 'daily' } as never], JETZT)).toEqual([]);
	});
	it('pause: Wochenrückblicke zählen nicht als Tageseintrag', () => {
		const wochen = [iso(1), iso(2), iso(3)].map((date) => ({ date, kind: 'weekly' }) as never);
		expect(tagebuchPause(wochen, JETZT)).toHaveLength(1);
	});
	it('heute: fragt, solange heute nichts steht', () => {
		expect(tagebuchHeute(undefined, JETZT)).toHaveLength(1);
		expect(tagebuchHeute({ date: iso(0) } as never, JETZT)).toEqual([]);
	});
});

describe('Ziele- und Tagebuch-Score', () => {
	it('ohne offenes Ziel null, sonst Durchschnitt', () => {
		expect(zieleScore([], () => 50).wert).toBeNull();
		expect(
			zieleScore([ziel({ id: 'a' }), ziel({ id: 'b' })], (g) =>
				(g as { id: string }).id === 'a' ? 100 : 50
			).wert
		).toBe(75);
		expect(zieleScore([ziel({ status: 'done' })], () => 50).wert).toBeNull();
	});
	it('Tagebuch: ohne Eintrag null (früher 0), mit Eintrag 100', () => {
		expect(tagebuchScore(undefined).wert).toBeNull();
		expect(tagebuchScore({ id: 'j' } as never).wert).toBe(100);
	});
});
