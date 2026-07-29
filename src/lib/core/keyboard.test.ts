import { describe, expect, it } from 'vitest';
import { isKeyboardOpen, KEYBOARD_MIN_OFFSET } from './keyboard.svelte';

describe('isKeyboardOpen', () => {
	it('erkennt die Tastatur an der geschrumpften Hoehe', () => {
		expect(isKeyboardOpen(800, 450, false)).toBe(true);
	});

	it('ignoriert kleine Differenzen wie ein-/ausblendende Browserleisten', () => {
		expect(isKeyboardOpen(800, 800, false)).toBe(false);
		expect(isKeyboardOpen(800, 800 - KEYBOARD_MIN_OFFSET, false)).toBe(false);
		expect(isKeyboardOpen(800, 800 - KEYBOARD_MIN_OFFSET - 1, false)).toBe(true);
	});

	it('haelt das Auf-/Zuklappen eines Faltgeraets nicht fuer eine Tastatur', () => {
		// Fold: Breite UND Hoehe aendern sich, waehrend die Viewports kurz
		// unterschiedliche Staende melden — ohne die Breitenpruefung waere das
		// hier faelschlich `true` und die Bottom-Nav verschwaende.
		expect(isKeyboardOpen(900, 600, true)).toBe(false);
	});

	it('meldet auch beim Drehen keine Tastatur', () => {
		expect(isKeyboardOpen(430, 200, true)).toBe(false);
	});
});
