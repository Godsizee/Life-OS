import { describe, expect, it } from 'vitest';
import { frequenzAenderungen, rekordAenderungen, type ZielKern } from './training-fortschritt.js';

const ziel = (patch: Partial<ZielKern> = {}): ZielKern => ({
	id: 'z1',
	title: 'Bankdrücken 100 kg',
	goal_type: 'pr',
	status: 'in_progress',
	progress: 0,
	target_exercise: 'Bankdrücken',
	target_value: 100,
	...patch
});

describe('rekordAenderungen', () => {
	it('setzt den Fortschritt aus dem geschätzten 1RM, unabhängig von der Schreibweise der Übung', () => {
		expect(rekordAenderungen([ziel()], 'bankdrücken', 80)).toEqual([
			{ id: 'z1', titel: 'Bankdrücken 100 kg', alt: 0, neu: 80 }
		]);
	});

	it('deckelt bei 100 %', () => {
		expect(rekordAenderungen([ziel()], 'Bankdrücken', 130)[0].neu).toBe(100);
	});

	it('steigert nur, senkt nie', () => {
		expect(rekordAenderungen([ziel({ progress: 90 })], 'Bankdrücken', 80)).toEqual([]);
		expect(rekordAenderungen([ziel({ progress: 80 })], 'Bankdrücken', 80)).toEqual([]);
	});

	it('überspringt erledigte Ziele, andere Übungen und andere Zieltypen', () => {
		expect(rekordAenderungen([ziel({ status: 'done' })], 'Bankdrücken', 80)).toEqual([]);
		expect(rekordAenderungen([ziel()], 'Kniebeuge', 80)).toEqual([]);
		expect(rekordAenderungen([ziel({ goal_type: 'standard' })], 'Bankdrücken', 80)).toEqual([]);
	});

	it('überspringt Ziele ohne gültigen Zielwert', () => {
		expect(rekordAenderungen([ziel({ target_value: null })], 'Bankdrücken', 80)).toEqual([]);
		expect(rekordAenderungen([ziel({ target_value: 0 })], 'Bankdrücken', 80)).toEqual([]);
	});

	it('trifft mehrere Ziele derselben Übung', () => {
		const res = rekordAenderungen(
			[ziel(), ziel({ id: 'z2', target_value: 200 })],
			'Bankdrücken',
			100
		);
		expect(res.map((r) => [r.id, r.neu])).toEqual([
			['z1', 100],
			['z2', 50]
		]);
	});
});

describe('frequenzAenderungen', () => {
	const frequenz = (patch: Partial<ZielKern> = {}) =>
		ziel({
			id: 'f1',
			title: '3× pro Woche',
			goal_type: 'fitness_frequency',
			target_exercise: null,
			target_value: 3,
			...patch
		});
	const donnerstag = new Date(2026, 5, 25);

	it('nutzt die Formel des Life-Scores (Pro-rata bis zum heutigen Wochentag)', () => {
		// Donnerstag = Tag 4: Pro-rata-Ziel = 3 × 4/7 ≈ 1,71 → 1 Trainingstag = 58 %
		expect(frequenzAenderungen([frequenz()], 1, donnerstag)).toEqual([
			{ id: 'f1', titel: '3× pro Woche', alt: 0, neu: 58 }
		]);
	});

	it('deckelt bei 100 % und steigert nur', () => {
		expect(frequenzAenderungen([frequenz()], 5, donnerstag)[0].neu).toBe(100);
		expect(frequenzAenderungen([frequenz({ progress: 100 })], 5, donnerstag)).toEqual([]);
	});

	it('überspringt erledigte Ziele, Ziele ohne Wochenziel und andere Typen', () => {
		expect(frequenzAenderungen([frequenz({ status: 'done' })], 3, donnerstag)).toEqual([]);
		expect(frequenzAenderungen([frequenz({ target_value: null })], 3, donnerstag)).toEqual([]);
		expect(frequenzAenderungen([ziel()], 3, donnerstag)).toEqual([]);
	});
});
