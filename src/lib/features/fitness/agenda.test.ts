import { describe, expect, it } from 'vitest';
import { trainingAgenda } from './agenda.js';

const TAG = new Date(2026, 9, 7, 12, 0); // Mittwoch, Woche beginnt Mo 05.10.

describe('trainingAgenda', () => {
	it('bietet ein Training an, wenn das Wochenziel noch offen ist', () => {
		const [e] = trainingAgenda([{ date: '2026-10-05' }], 3, TAG);
		expect(e.art).toBe('training');
		expect(e.warum).toBe('Wochenziel: 1 von 3');
		expect(e.start).toBeNull();
	});

	it('schweigt ohne Wochenziel', () => {
		expect(trainingAgenda([], 0, TAG)).toEqual([]);
	});

	it('schweigt, wenn heute schon trainiert wurde', () => {
		expect(trainingAgenda([{ date: '2026-10-07' }], 3, TAG)).toEqual([]);
	});

	it('schweigt, wenn das Wochenziel erreicht ist', () => {
		expect(trainingAgenda([{ date: '2026-10-05' }, { date: '2026-10-06' }], 2, TAG)).toEqual([]);
	});

	it('startet einen verknüpften Plan aus dem Termin', () => {
		const [e] = trainingAgenda([], 2, TAG, { id: 'p1', name: 'Push' });
		expect(e.titel).toBe('Push starten');
		expect(e.href).toBe('/fitness?startPlan=p1');
	});
});
