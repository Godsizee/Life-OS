import { describe, expect, it } from 'vitest';
import { bmi, bmiCategory, formatWater, formatWeight, glassesToMl, mlToGlasses } from './units';

describe('Wasser-Umrechnung', () => {
	it('rechnet Gläser in ml mit der eingestellten Glasgröße', () => {
		expect(glassesToMl(8, 250)).toBe(2000);
		expect(glassesToMl(8, 300)).toBe(2400);
	});

	it('rechnet zurück und rundet auf eine Nachkommastelle', () => {
		expect(mlToGlasses(2000, 250)).toBe(8);
		expect(mlToGlasses(1875, 250)).toBe(7.5);
	});

	it('behandelt Unsinn defensiv', () => {
		expect(glassesToMl(-1)).toBe(0);
		expect(mlToGlasses(500, 0)).toBe(0);
	});

	it('formatiert je nach Einheit', () => {
		expect(formatWater(2000, 'ml')).toBe('2 l');
		expect(formatWater(750, 'ml')).toBe('750 ml');
		expect(formatWater(250, 'glasses', 250)).toBe('1 Glas');
		expect(formatWater(2000, 'glasses', 250)).toBe('8 Gläser');
		expect(formatWater(null, 'ml')).toBe('—');
	});
});

describe('Gewicht & BMI', () => {
	it('formatiert kg und lb', () => {
		expect(formatWeight(72.5, 'kg')).toBe('72,5 kg');
		expect(formatWeight(100, 'lb')).toBe('220,5 lb');
	});

	it('berechnet BMI und Kategorie', () => {
		expect(bmi(72, 180)).toBe(22.2);
		expect(bmiCategory(22.2)).toBe('normal');
		expect(bmi(72, null)).toBeNull();
	});
});
