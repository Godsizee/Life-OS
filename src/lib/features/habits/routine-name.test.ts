import { describe, expect, it } from 'vitest';
import { routineNachName } from './routine-name.js';

const r = (name: string, archived = false) => ({ name, archived });

describe('routineNachName', () => {
	it('findet unabhängig von Groß-/Kleinschreibung und Randleerzeichen', () => {
		const liste = [r('Lesen'), r('Sport')];
		expect(routineNachName(liste, 'sport')).toBe(liste[1]);
		expect(routineNachName(liste, '  SPORT ')).toBe(liste[1]);
	});

	it('findet keine Teiltreffer', () => {
		expect(routineNachName([r('Sport')], 'Sport machen')).toBeUndefined();
	});

	it('überspringt archivierte Routinen', () => {
		expect(routineNachName([r('Sport', true)], 'Sport')).toBeUndefined();
	});

	it('findet bei leerem Namen nichts', () => {
		expect(routineNachName([r('')], '   ')).toBeUndefined();
	});
});
