import { describe, expect, it } from 'vitest';
import { serieErklaerung } from './erklaerung';
import type { HabitDay } from './streak';

const erledigt = (date: string): HabitDay => ({ date, value: 1, status: 'done' });
const heute = new Date(2026, 9, 10);

describe('Warum diese Serie', () => {
	it('nennt Serie, beste Serie und die Zählweise', () => {
		const w = serieErklaerung(
			{ schedule: { type: 'daily' }, target_value: null },
			['2026-10-08', '2026-10-09', '2026-10-10'].map(erledigt),
			[],
			heute
		);
		expect(w.warumJetzt).toBe('Aktuell 3 Tage.');
		expect(w.daten).toContain('Beste Serie: 3 Tage');
		expect(w.daten.some((d) => d.startsWith('Zählweise: Jeder fällige'))).toBe(true);
		expect(w.daten.some((d) => d.startsWith('Pausen:'))).toBe(false);
	});

	it('führt Pausen mit Grund und Zeitraum auf', () => {
		const w = serieErklaerung(
			{ schedule: { type: 'daily' }, target_value: null },
			[],
			[{ von: '2026-10-02', bis: '2026-10-08', grund: 'urlaub' }],
			heute
		);
		expect(w.daten.some((d) => d.includes('02.10.–08.10. (Urlaub)'))).toBe(true);
	});

	it('zählt bei „x-mal pro Woche“ in Wochen', () => {
		const w = serieErklaerung(
			{ schedule: { type: 'weekly_count', times: 3 }, target_value: null },
			[],
			[],
			heute
		);
		expect(w.was).toContain('Wochen am Stück');
		expect(w.daten[0]).toBe('Zählweise: Eine Woche zählt, wenn die Routine 3-mal erledigt ist.');
	});
});
