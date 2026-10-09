import { describe, expect, it } from 'vitest';
import { ringeErklaerung } from './erklaerung';

describe('Warum die Ringe', () => {
	it('nennt Ziel und Einheit je Ring', () => {
		const w = ringeErklaerung({
			wasserZiel: '8 Gläser',
			schlafZielH: 8,
			gewichtZiel: '75 kg',
			gewichtStart: '82 kg'
		});
		expect(w.daten).toContain('Wasser: Tageswert gegen 8 Gläser');
		expect(w.daten).toContain('Schlaf: Stunden gegen 8 h');
		expect(w.daten).toContain('Gewicht: Weg vom ersten Wert (82 kg) zum Ziel 75 kg');
	});

	it('beschreibt den Gewichts-Ring ohne Ziel', () => {
		const w = ringeErklaerung({
			wasserZiel: '2000 ml',
			schlafZielH: 7.5,
			gewichtZiel: null,
			gewichtStart: null
		});
		expect(w.daten).toContain('Gewicht: Ohne Ziel bleibt der Ring leer');
	});
});
