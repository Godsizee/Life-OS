import { describe, it, expect } from 'vitest';
import { isBodyweightExercise, effectiveWeight } from './volume';

describe('isBodyweightExercise', () => {
	it('erkennt die Katalogwerte', () => {
		expect(isBodyweightExercise('Körpergewicht')).toBe(true);
		expect(isBodyweightExercise('none')).toBe(true);
		expect(isBodyweightExercise(null)).toBe(true);
		expect(isBodyweightExercise('Langhantel')).toBe(false);
	});
});

describe('effectiveWeight', () => {
	it('rechnet das Körpergewicht bei Eigengewichtsübungen mit', () => {
		expect(effectiveWeight({ weight_kg: 0, exercise_type: 'strength' }, 72.5, true)).toBe(72.5);
	});

	it('addiert Zusatzgewicht', () => {
		expect(effectiveWeight({ weight_kg: 10, exercise_type: 'strength' }, 72.5, true)).toBe(82.5);
	});

	it('lässt Hantelübungen unverändert', () => {
		expect(effectiveWeight({ weight_kg: 60, exercise_type: 'strength' }, 72.5, false)).toBe(60);
	});

	it('ohne erfasstes Körpergewicht bleibt es beim Zusatzgewicht', () => {
		expect(effectiveWeight({ weight_kg: 0, exercise_type: 'strength' }, null, true)).toBe(0);
	});

	it('Cardio hat kein Gewicht', () => {
		expect(effectiveWeight({ weight_kg: 5, exercise_type: 'cardio' as any }, 72.5, false)).toBe(0);
	});
});
