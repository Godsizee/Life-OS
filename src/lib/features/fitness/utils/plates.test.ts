import { describe, expect, it } from 'vitest';
import { calculatePlates } from './plates';

describe('calculatePlates', () => {
	it('splits a classic 100 kg target on a 20 kg bar into 40 kg per side', () => {
		const result = calculatePlates(100, 20);
		expect(result).not.toBeNull();
		expect(result!.perSideKg).toBe(40);
		expect(result!.perSide).toEqual([
			{ plateKg: 25, count: 1 },
			{ plateKg: 15, count: 1 }
		]);
		expect(result!.remainderKg).toBe(0);
	});

	it('uses small plates for odd targets like 87.5 kg', () => {
		const result = calculatePlates(87.5, 20);
		expect(result!.perSideKg).toBe(33.75);
		expect(result!.perSide).toEqual([
			{ plateKg: 25, count: 1 },
			{ plateKg: 5, count: 1 },
			{ plateKg: 2.5, count: 1 },
			{ plateKg: 1.25, count: 1 }
		]);
		expect(result!.remainderKg).toBe(0);
	});

	it('reports the unrepresentable remainder per side', () => {
		// 22 kg → 1 kg pro Seite, kleinste Scheibe ist 1.25 kg.
		const result = calculatePlates(22, 20);
		expect(result!.perSide).toEqual([]);
		expect(result!.remainderKg).toBe(1);
	});

	it('returns an empty breakdown when target equals the bar weight', () => {
		const result = calculatePlates(20, 20);
		expect(result!.perSide).toEqual([]);
		expect(result!.perSideKg).toBe(0);
		expect(result!.remainderKg).toBe(0);
	});

	it('returns null when the target is below the bar weight', () => {
		expect(calculatePlates(15, 20)).toBeNull();
	});

	it('stacks multiple plates of the same size', () => {
		// 140 kg auf 20-kg-Stange → 60 kg pro Seite = 2×25 + 1×10.
		const result = calculatePlates(140, 20);
		expect(result!.perSide).toEqual([
			{ plateKg: 25, count: 2 },
			{ plateKg: 10, count: 1 }
		]);
	});
});
