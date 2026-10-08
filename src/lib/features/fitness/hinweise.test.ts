import { describe, expect, it } from 'vitest';
import { trainingPause } from './hinweise';
import { trainingKontext } from './tag';

const JETZT = new Date(2026, 9, 8, 12, 0);
const iso = (tageZurueck: number) => {
	const d = new Date(JETZT);
	d.setDate(d.getDate() - tageZurueck);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const plan = [{ id: 'p1' }];

describe('fitness.pause', () => {
	it('erinnert, wenn Pläne da sind, aber lange kein Training lief', () => {
		expect(trainingPause(plan, [{ date: iso(9) }], JETZT)).toHaveLength(1);
	});
	it('erinnert auch, wenn es noch gar kein Training gab', () => {
		expect(trainingPause(plan, [], JETZT)).toHaveLength(1);
	});
	it('nimmt das jüngste Workout, egal in welcher Reihenfolge die Liste kommt', () => {
		expect(trainingPause(plan, [{ date: iso(9) }, { date: iso(1) }], JETZT)).toEqual([]);
	});
	it('schweigt nach einem frischen Training', () => {
		expect(trainingPause(plan, [{ date: iso(1) }], JETZT)).toEqual([]);
	});
	it('schweigt ohne Trainingsplan — sonst wäre es eine Aufforderung ins Leere', () => {
		expect(trainingPause([], [], JETZT)).toEqual([]);
	});
});

describe('trainingKontext', () => {
	it('erkennt ein Workout am Tag', () => {
		expect(trainingKontext([{ date: '2026-10-08' } as never], '2026-10-08')).toEqual({
			workout: true
		});
		expect(trainingKontext([], '2026-10-08')).toEqual({ workout: false });
	});
});
