import { describe, expect, it } from 'vitest';
import { aufgabenAgenda } from './agenda.js';
import type { Task } from './types.js';

const TAG = new Date(2026, 9, 7, 12, 0); // Mi 07.10.2026
const iso = (h: number, min = 0, tag = 7) => new Date(2026, 9, tag, h, min).toISOString();

let n = 0;
function aufgabe(teil: Partial<Task>): Task {
	n += 1;
	return {
		id: `t${n}`,
		workspace_id: 'w',
		project_id: null,
		goal_id: null,
		title: `Aufgabe ${n}`,
		description: null,
		labels: [],
		parent_id: null,
		status: 'todo',
		priority: 'medium',
		due_at: null,
		planned_for: null,
		estimate_min: null,
		scheduled_start: null,
		assignee_id: null,
		rrule: null,
		position: 0,
		created_by: 'u',
		created_at: iso(8, 0, 1),
		updated_at: iso(8, 0, 1),
		completed_at: null,
		focus_week: null,
		...teil
	};
}

describe('aufgabenAgenda', () => {
	it('nimmt für heute geplante Aufgaben, mit Dauer und Begründung', () => {
		const [e] = aufgabenAgenda([aufgabe({ planned_for: '2026-10-07', estimate_min: 45 })], TAG);
		expect(e.art).toBe('aufgabe');
		expect(e.dauerMin).toBe(45);
		expect(e.warum).toBe('Für heute geplant');
		expect(e.start).toBeNull();
	});

	it('nimmt Aufgaben mit Frist heute, mit Uhrzeit im Text', () => {
		const [e] = aufgabenAgenda([aufgabe({ due_at: iso(17) })], TAG);
		expect(e.warum).toBe('Frist heute 17:00');
	});

	it('zeigt eine Frist ohne Uhrzeit (23:59) als „Frist heute“', () => {
		const [e] = aufgabenAgenda([aufgabe({ due_at: iso(23, 59) })], TAG);
		expect(e.warum).toBe('Frist heute');
	});

	it('legt einen Zeitblock auf die Zeitachse, das Ende kommt aus der Schätzung', () => {
		const [e] = aufgabenAgenda(
			[aufgabe({ planned_for: '2026-10-07', scheduled_start: iso(14), estimate_min: 60 })],
			TAG
		);
		expect(e.start?.getHours()).toBe(14);
		expect(e.ende?.getHours()).toBe(15);
		expect(e.warum).toBe('Zeitblock 14:00');
	});

	it('ignoriert Aufgaben für andere Tage und ohne Datum', () => {
		expect(
			aufgabenAgenda(
				[aufgabe({ planned_for: '2026-10-08' }), aufgabe({}), aufgabe({ due_at: iso(10, 0, 9) })],
				TAG
			)
		).toEqual([]);
	});

	it('zeigt heute erledigte Aufgaben als erledigt, früher erledigte nicht', () => {
		const heute = aufgabe({ planned_for: '2026-10-07', status: 'done', completed_at: iso(9) });
		const gestern = aufgabe({
			planned_for: '2026-10-07',
			status: 'done',
			completed_at: iso(9, 0, 6)
		});
		const r = aufgabenAgenda([heute, gestern], TAG);
		expect(r).toHaveLength(1);
		expect(r[0].erledigt).toBe(true);
	});

	it('lässt verworfene Aufgaben weg', () => {
		expect(
			aufgabenAgenda([aufgabe({ planned_for: '2026-10-07', status: 'dropped' })], TAG)
		).toEqual([]);
	});

	it('ordnet nach Priorität, dann Frist, offene vor erledigten', () => {
		const niedrig = aufgabe({ planned_for: '2026-10-07', title: 'Niedrig', priority: 'low' });
		const spaet = aufgabe({ planned_for: '2026-10-07', title: 'Spät', due_at: iso(18) });
		const frueh = aufgabe({ planned_for: '2026-10-07', title: 'Früh', due_at: iso(9) });
		const hoch = aufgabe({ planned_for: '2026-10-07', title: 'Hoch', priority: 'high' });
		const fertig = aufgabe({
			planned_for: '2026-10-07',
			title: 'Fertig',
			priority: 'high',
			status: 'done',
			completed_at: iso(8)
		});
		const r = aufgabenAgenda([niedrig, spaet, fertig, frueh, hoch], TAG);
		expect(r.map((e) => e.titel)).toEqual(['Hoch', 'Früh', 'Spät', 'Niedrig', 'Fertig']);
	});
});
