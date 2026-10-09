import { describe, expect, it } from 'vitest';
import type { Task } from '#lib/features/tasks/types.js';
import { imEingang } from '#lib/features/tasks/utils.js';
import { fuerMorgen, gesternOffen, heuteOffen, planKandidaten, vortag } from './ritual-logik.js';

const JETZT = new Date(2026, 9, 7, 9, 0); // Mi 07.10.2026, Woche ab Mo 05.10.
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

describe('imEingang', () => {
	it('gilt für offene Aufgaben ohne Projekt, Tag, Frist, Eltern und Wochenfokus', () => {
		expect(imEingang(aufgabe({}))).toBe(true);
	});

	it.each([
		['Projekt', { project_id: 'p' }],
		['Plantag', { planned_for: '2026-10-08' }],
		['Frist', { due_at: iso(9) }],
		['Unteraufgabe', { parent_id: 'x' }],
		['Wochenfokus', { focus_week: '2026-10-05' }],
		['erledigt', { status: 'done' as const }],
		['verworfen', { status: 'dropped' as const }]
	])('gilt nicht bei %s', (_name, teil) => {
		expect(imEingang(aufgabe(teil as Partial<Task>))).toBe(false);
	});
});

describe('planKandidaten', () => {
	it('wählt je Aufgabe den stärksten Grund und ordnet danach', () => {
		const eingang = aufgabe({ title: 'Eingang' });
		const fokus = aufgabe({ title: 'Fokus', focus_week: '2026-10-05' });
		const bald = aufgabe({ title: 'Bald', due_at: iso(9) });
		const vorbei = aufgabe({ title: 'Vorbei', due_at: iso(5) });
		const geplant = aufgabe({ title: 'Geplant', planned_for: '2026-10-07' });
		const r = planKandidaten([eingang, fokus, bald, vorbei, geplant], JETZT);
		expect(r.map((k) => [k.task.title, k.grund])).toEqual([
			['Geplant', 'geplant'],
			['Vorbei', 'frist-vorbei'],
			['Bald', 'frist-bald'],
			['Fokus', 'wochenfokus'],
			['Eingang', 'eingang']
		]);
	});

	it('nennt eine überschrittene Frist ohne Schuldzuweisung', () => {
		const [k] = planKandidaten([aufgabe({ due_at: iso(5) })], JETZT);
		expect(k.text).toBe('Frist vorbei — heute angehen oder neu planen?');
	});

	it('lässt Aufgaben ohne Anlass, erledigte und fernere Fristen weg', () => {
		const r = planKandidaten(
			[
				aufgabe({ project_id: 'p' }),
				aufgabe({ status: 'done', planned_for: '2026-10-07' }),
				aufgabe({ due_at: iso(20), project_id: 'p' })
			],
			JETZT
		);
		expect(r).toEqual([]);
	});

	it('ein Wochenfokus einer anderen Woche zählt nicht', () => {
		expect(planKandidaten([aufgabe({ focus_week: '2026-09-28' })], JETZT)).toEqual([]);
	});
});

describe('gesternOffen und heuteOffen', () => {
	it('findet offene Aufgaben von gestern', () => {
		const a = aufgabe({ planned_for: '2026-10-06' });
		const fertig = aufgabe({ planned_for: '2026-10-06', status: 'done' });
		expect(gesternOffen([a, fertig], JETZT)).toEqual([a]);
	});

	it('heuteOffen: geplant oder heute fällig, ohne Erledigte und Verworfene', () => {
		const geplant = aufgabe({ planned_for: '2026-10-07' });
		const faellig = aufgabe({ due_at: iso(7, 17) });
		const fertig = aufgabe({ planned_for: '2026-10-07', status: 'done' });
		const verworfen = aufgabe({ planned_for: '2026-10-07', status: 'dropped' });
		expect(heuteOffen([geplant, faellig, fertig, verworfen], JETZT)).toEqual([geplant, faellig]);
	});
});

describe('fuerMorgen', () => {
	it('schlägt Dringendes vor dem Eingang vor und begrenzt die Zahl', () => {
		const bald = aufgabe({ due_at: iso(9) });
		const eingang = aufgabe({});
		const schonMorgen = aufgabe({ planned_for: '2026-10-08', due_at: iso(9) });
		expect(fuerMorgen([eingang, schonMorgen, bald], JETZT)).toEqual([bald, eingang]);
		expect(fuerMorgen([eingang, bald], JETZT, 1)).toEqual([bald]);
	});
});

describe('vortag', () => {
	it('liefert den Vortag, auch über Monatsgrenzen', () => {
		expect(vortag('2026-10-07')).toBe('2026-10-06');
		expect(vortag('2026-10-01')).toBe('2026-09-30');
		expect(vortag('kaputt')).toBeNull();
	});
});
