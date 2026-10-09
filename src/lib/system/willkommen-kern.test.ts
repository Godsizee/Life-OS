import { describe, expect, it } from 'vitest';
import type { Task } from '#lib/features/tasks/types.js';
import {
	alteKlaerungen,
	fristAmTag,
	fristenVorbei,
	ohnePlan,
	pauseNachtragen,
	tageWeg,
	zeigeWillkommen
} from './willkommen-kern.js';

const HEUTE = '2026-10-09';
const iso = (tag: number, h = 12) => new Date(2026, 9, tag, h).toISOString();

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
		position: n,
		created_by: 'u',
		created_at: iso(1),
		updated_at: iso(1),
		completed_at: null,
		focus_week: null,
		...teil
	};
}

describe('Willkommen zurück: Abwesenheit', () => {
	it('zählt ganze Kalendertage, auch über den Monatswechsel', () => {
		expect(tageWeg('2026-10-03', HEUTE)).toBe(6);
		expect(tageWeg('2026-09-28', HEUTE)).toBe(11);
		expect(tageWeg(HEUTE, HEUTE)).toBe(0);
	});

	it('zählt über die Zeitumstellung korrekt', () => {
		expect(tageWeg('2026-10-24', '2026-10-27')).toBe(3);
		expect(tageWeg('2026-03-27', '2026-03-30')).toBe(3);
	});

	it('liefert null bei leerem oder ungültigem Datum', () => {
		expect(tageWeg('', HEUTE)).toBeNull();
		expect(tageWeg('gestern', HEUTE)).toBeNull();
	});

	it('zeigt die Box erst ab der Schwelle', () => {
		expect(zeigeWillkommen('2026-10-07', HEUTE, 3)).toBe(false);
		expect(zeigeWillkommen('2026-10-06', HEUTE, 3)).toBe(true);
		expect(zeigeWillkommen('', HEUTE, 3)).toBe(false);
	});
});

describe('Willkommen zurück: Pause nachtragen', () => {
	it('geht vom Tag nach der letzten Aktivität bis gestern', () => {
		expect(pauseNachtragen('2026-10-03', HEUTE)).toEqual({
			von: '2026-10-04',
			bis: '2026-10-08',
			grund: 'abwesend'
		});
	});

	it('gibt null zurück, wenn kein Tag dazwischen liegt', () => {
		expect(pauseNachtragen('2026-10-08', HEUTE)).toBeNull();
		expect(pauseNachtragen(HEUTE, HEUTE)).toBeNull();
		expect(pauseNachtragen('', HEUTE)).toBeNull();
	});
});

describe('Willkommen zurück: Aufgaben', () => {
	it('nimmt nur offene Aufgaben mit früherem Plan in den Neustart', () => {
		const alt = aufgabe({ planned_for: '2026-10-05' });
		const heute = aufgabe({ planned_for: HEUTE });
		const erledigt = aufgabe({ planned_for: '2026-10-05', status: 'done' });
		const ohne = aufgabe({});
		expect(alteKlaerungen([alt, heute, erledigt, ohne], HEUTE)).toEqual([alt]);
	});

	it('listet Fristen vor heute nach Datum und lässt heutige und spätere weg', () => {
		const a = aufgabe({ due_at: iso(7) });
		const b = aufgabe({ due_at: iso(3) });
		const heute = aufgabe({ due_at: iso(9) });
		const spaeter = aufgabe({ due_at: iso(12) });
		const erledigt = aufgabe({ due_at: iso(2), status: 'done' });
		expect(fristenVorbei([a, b, heute, spaeter, erledigt], HEUTE)).toEqual([b, a]);
	});

	it('zählt offene Aufgaben ohne Plan für heute oder später', () => {
		const tasks = [
			aufgabe({}),
			aufgabe({ planned_for: '2026-10-05' }),
			aufgabe({ planned_for: HEUTE }),
			aufgabe({ planned_for: '2026-10-12' }),
			aufgabe({ status: 'done' })
		];
		expect(ohnePlan(tasks, HEUTE)).toBe(2);
	});

	it('setzt eine Frist ohne Uhrzeit auf das Tagesende in lokaler Zeit', () => {
		const d = new Date(fristAmTag('2026-10-20'));
		expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([
			2026, 9, 20, 23, 59
		]);
	});
});
