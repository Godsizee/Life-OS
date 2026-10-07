import { describe, expect, it } from 'vitest';
import { findeTrainingsRoutine, istTrainingsName } from './training-name.js';

const routine = (
	id: string,
	name: string,
	extra: { archived?: boolean; goal_id?: string } = {}
) => ({
	id,
	name,
	archived: false,
	...extra
});

describe('istTrainingsName', () => {
	it.each(['Sport', 'Workout am Morgen', 'Gym', 'Laufen', 'Krafttraining', 'Übung'])(
		'erkennt %s',
		(name) => expect(istTrainingsName(name)).toBe(true)
	);

	it.each(['Wasser trinken', 'Lesen', 'Meditieren', ''])('lässt %s aus', (name) =>
		expect(istTrainingsName(name)).toBe(false)
	);
});

describe('findeTrainingsRoutine', () => {
	const ziele = [
		{ id: 'z1', goal_type: 'fitness_frequency' },
		{ id: 'z2', goal_type: 'standard' }
	];

	it('findet die einzige Routine über den Namen', () => {
		const res = findeTrainingsRoutine([routine('h1', 'Sport'), routine('h2', 'Lesen')], ziele);
		expect(res?.routine.id).toBe('h1');
		expect(res?.grund).toBe('name');
	});

	it('findet die einzige Routine über ein gekoppeltes Häufigkeitsziel, auch ohne Trainings-Namen', () => {
		const res = findeTrainingsRoutine(
			[routine('h1', 'Bewegen? Nein: Hanteln', { goal_id: 'z1' }), routine('h2', 'Lesen')],
			ziele
		);
		expect(res?.routine.id).toBe('h1');
		expect(res?.grund).toBe('ziel');
	});

	it('ignoriert Kopplungen an Ziele anderer Art', () => {
		expect(findeTrainingsRoutine([routine('h1', 'Lesen', { goal_id: 'z2' })], ziele)).toBeNull();
	});

	it('ignoriert archivierte Routinen', () => {
		expect(findeTrainingsRoutine([routine('h1', 'Sport', { archived: true })], ziele)).toBeNull();
	});

	it('rät bei mehreren Kandidaten nicht', () => {
		expect(findeTrainingsRoutine([routine('h1', 'Sport'), routine('h2', 'Gym')], ziele)).toBeNull();
	});

	it('liefert null, wenn nichts passt', () => {
		expect(findeTrainingsRoutine([routine('h1', 'Lesen')], ziele)).toBeNull();
		expect(findeTrainingsRoutine([], [])).toBeNull();
	});
});
