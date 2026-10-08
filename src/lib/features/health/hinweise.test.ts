import { describe, expect, it } from 'vitest';
import { schlafKnapp, wasserHeute } from './hinweise';
import { gesundheitKontext, gesundheitScore } from './tag';

const eintrag = (p: Record<string, unknown>) =>
	({
		date: '2026-10-08',
		weight_kg: null,
		sleep_h: null,
		water_ml: null,
		energy: null,
		...p
	}) as never;
const nacht = (h: number | null, i = 1) => eintrag({ date: `2026-10-0${i}`, sleep_h: h });

describe('health.schlaf-knapp', () => {
	it('meldet ab drei kurzen Nächten der letzten fünf Einträge', () => {
		const r = schlafKnapp([nacht(5, 1), nacht(5.5, 2), nacht(4, 3), nacht(8, 4)]);
		expect(r).toHaveLength(1);
		expect(r[0].text).toContain('3 der letzten 4');
	});

	it('schweigt bei zwei kurzen Nächten', () => {
		expect(schlafKnapp([nacht(5, 1), nacht(5, 2), nacht(8, 3)])).toEqual([]);
	});

	it('behandelt fehlende Angaben nicht als kurze Nacht', () => {
		expect(schlafKnapp([nacht(null, 1), nacht(null, 2), nacht(null, 3)])).toEqual([]);
	});

	it('trifft keine medizinische Aussage', () => {
		const r = schlafKnapp([nacht(5, 1), nacht(5, 2), nacht(5, 3)])[0];
		expect(`${r.text} ${r.warum.was} ${r.warum.warumJetzt}`).not.toMatch(
			/gesund|krank|Störung|Therapie/i
		);
	});
});

describe('health.wasser-heute', () => {
	const nachmittag = new Date(2026, 9, 8, 14, 0);
	const vormittag = new Date(2026, 9, 8, 9, 0);

	it('erinnert erst ab 12:00', () => {
		expect(wasserHeute(eintrag({ water_ml: 0 }), vormittag)).toEqual([]);
		expect(wasserHeute(eintrag({ water_ml: 0 }), nachmittag)).toHaveLength(1);
	});

	it('erinnert auch ganz ohne Eintrag für heute', () => {
		expect(wasserHeute(null, nachmittag)).toHaveLength(1);
	});

	it('schweigt, sobald etwas eingetragen ist', () => {
		expect(wasserHeute(eintrag({ water_ml: 250 }), nachmittag)).toEqual([]);
	});
});

describe('Gesundheits-Score und Kontext', () => {
	const ziele = { waterGoalMl: 2000, sleepGoalH: 8 };
	it('ohne Eintrag 0, mit vollem Eintrag 100', () => {
		expect(gesundheitScore(undefined, ziele).wert).toBe(0);
		expect(
			gesundheitScore(eintrag({ weight_kg: 80, sleep_h: 8, water_ml: 2000, energy: 4 }), ziele).wert
		).toBe(100);
	});
	it('Schlaf außerhalb des Ziels gibt Teilpunkte', () => {
		expect(gesundheitScore(eintrag({ sleep_h: 5 }), ziele).wert).toBe(15);
	});
	it('Kontext', () => {
		expect(gesundheitKontext(undefined)).toEqual({ sleep_h: null, water_ml: null });
		expect(gesundheitKontext(eintrag({ sleep_h: 7, water_ml: 500 }))).toEqual({
			sleep_h: 7,
			water_ml: 500
		});
	});
});
