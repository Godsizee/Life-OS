import { describe, expect, it } from 'vitest';
import { stimmungKontext, stimmungScore } from './tag';

const TAG = '2026-10-08';
const e = (score: number) => ({ date: TAG, score, activities: ['sport'] }) as never;

describe('stimmungScore', () => {
	it('ohne Eintrag null (früher 0)', () => {
		expect(stimmungScore([], TAG).wert).toBeNull();
	});
	it('rechnet die Skala 1–5 auf Prozent um', () => {
		expect(stimmungScore([e(5)], TAG).wert).toBe(100);
		expect(stimmungScore([e(3)], TAG).wert).toBe(60);
	});
});

describe('stimmungKontext', () => {
	it('liefert Wert und Aktivitäten, ohne Eintrag leer', () => {
		expect(stimmungKontext([e(4)], TAG)).toEqual({ mood: 4, mood_activities: ['sport'] });
		expect(stimmungKontext([], TAG)).toEqual({ mood: null, mood_activities: [] });
	});
});
