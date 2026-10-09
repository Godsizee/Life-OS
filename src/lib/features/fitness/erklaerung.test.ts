import { describe, expect, it } from 'vitest';
import { einRmErklaerung } from './erklaerung';
import { estimateOneRepMax } from './utils/1rm';

describe('Warum dieses 1RM', () => {
	it('zeigt Satz, Formel und Rechnung passend zur Berechnung', () => {
		const est = estimateOneRepMax(80, 5);
		const w = einRmErklaerung({ weight_kg: 80, reps: 5, est_1rm: est });
		expect(w.warumJetzt).toBe('Dein bester Satz ergibt 93,3 kg.');
		expect(w.daten).toContain('Satz: 80 kg × 5');
		expect(w.daten).toContain('Rechnung: 80 kg × (1 + 5 / 30) = 93,3 kg');
	});

	it('nimmt bei einer Wiederholung das Gewicht selbst', () => {
		const w = einRmErklaerung({ weight_kg: 100, reps: 1, est_1rm: 100 });
		expect(w.daten.some((d) => d.includes('Das Gewicht gilt selbst'))).toBe(true);
	});
});
