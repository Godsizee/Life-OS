import { describe, expect, it } from 'vitest';
import { aufgabenKontext, aufgabenScore, relevanteAufgaben } from './tag';

const TAG = '2026-10-08';
const lokal = (d: number, h = 12) => new Date(2026, 9, d, h).toISOString();
const t = (p: Record<string, unknown>) =>
	({ status: 'todo', planned_for: null, due_at: null, completed_at: null, ...p }) as never;

describe('relevanteAufgaben', () => {
	it('nimmt geplante, fällige und am Tag erledigte Aufgaben', () => {
		const r = relevanteAufgaben(
			[
				t({ planned_for: TAG }),
				t({ due_at: lokal(8) }),
				t({ status: 'done', completed_at: lokal(8) }),
				t({ planned_for: '2026-10-09' }),
				t({ due_at: lokal(9) })
			],
			TAG
		);
		expect(r).toHaveLength(3);
	});

	it('vergleicht Fristen im LOKALEN Kalendertag, nicht im UTC-Präfix (Falle F7)', () => {
		// 8.10. um 00:30 Ortszeit ist in UTC noch der 7.10.
		const frueh = new Date(2026, 9, 8, 0, 30).toISOString();
		expect(relevanteAufgaben([t({ due_at: frueh })], TAG)).toHaveLength(1);
		expect(relevanteAufgaben([t({ due_at: frueh })], '2026-10-07')).toHaveLength(0);
	});

	it('verworfene Aufgaben zählen nicht', () => {
		expect(relevanteAufgaben([t({ status: 'dropped', planned_for: TAG })], TAG)).toEqual([]);
	});
});

describe('aufgabenScore', () => {
	it('ohne relevante Aufgabe ist der Wert null, nicht 100', () => {
		expect(aufgabenScore([], TAG).wert).toBeNull();
	});

	it('zählt erledigt gegen alle relevanten', () => {
		const r = aufgabenScore(
			[
				t({ planned_for: TAG, status: 'done', completed_at: lokal(8) }),
				t({ planned_for: TAG }),
				t({ planned_for: TAG, status: 'dropped' })
			],
			TAG
		);
		expect(r.wert).toBe(50);
		expect(r.erklaerung).toContain('1 von 2');
	});
});

describe('aufgabenKontext', () => {
	it('liefert erledigt und gesamt', () => {
		expect(
			aufgabenKontext(
				[t({ planned_for: TAG, status: 'done', completed_at: lokal(8) }), t({ planned_for: TAG })],
				TAG
			)
		).toEqual({ tasks_done: 1, tasks_total: 2 });
	});
});
