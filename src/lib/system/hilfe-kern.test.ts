import { describe, expect, it } from 'vitest';
import type { HilfeThema } from '#lib/core/modul.js';
import { SYSTEM_THEMEN } from '#lib/features/hilfe/inhalte/system.js';
import {
	findeThema,
	glossar,
	gruppiereThemen,
	hilfeIdFuerPfad,
	sammleThemen,
	sucheThemen
} from './hilfe-kern.js';

const thema = (id: string, titel: string, teil: Partial<HilfeThema> = {}): HilfeThema => ({
	id,
	titel,
	kurz: `${titel} kurz`,
	abschnitte: [{ text: 'Text' }],
	...teil
});

describe('System-Themen', () => {
	it('haben eindeutige Ids, Titel, einen Satz und mindestens einen Abschnitt', () => {
		const ids = SYSTEM_THEMEN.map((t) => t.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const t of SYSTEM_THEMEN) {
			expect(t.id.startsWith('system.')).toBe(true);
			expect(t.titel.length).toBeGreaterThan(0);
			expect(t.kurz.length).toBeGreaterThan(0);
			expect(t.abschnitte.length).toBeGreaterThan(0);
		}
	});

	it('enthalten keine Ausrufezeichen', () => {
		const alles = JSON.stringify(SYSTEM_THEMEN);
		expect(alles).not.toContain('!');
	});

	it('verweisen nur auf vorhandene Themen', () => {
		const ids = new Set(SYSTEM_THEMEN.map((t) => t.id));
		for (const t of SYSTEM_THEMEN) for (const v of t.verwandt ?? []) expect(ids.has(v)).toBe(true);
	});
});

describe('sucheThemen', () => {
	it('findet „Freie Zeit und Kapazität“ mit „kapaz“', () => {
		expect(sucheThemen(SYSTEM_THEMEN, 'kapaz')[0].id).toBe('system.kapazitaet');
	});

	it('findet über Begriffe', () => {
		expect(sucheThemen(SYSTEM_THEMEN, 'tagesfenster').map((t) => t.id)).toContain(
			'system.kapazitaet'
		);
	});

	it('liefert ohne Anfrage alle und bei Unsinn nichts', () => {
		expect(sucheThemen(SYSTEM_THEMEN, '')).toHaveLength(SYSTEM_THEMEN.length);
		expect(sucheThemen(SYSTEM_THEMEN, 'qqqqzzzz')).toEqual([]);
	});
});

describe('glossar', () => {
	it('sortiert alphabetisch und führt jedes Wort einmal', () => {
		const g = glossar([
			thema('a.x', 'A', {
				begriffe: [
					{ wort: 'Zeta', erklaerung: 'z' },
					{ wort: 'Eingang', erklaerung: 'e' }
				]
			}),
			thema('b.y', 'B', {
				begriffe: [
					{ wort: 'eingang', erklaerung: 'doppelt' },
					{ wort: 'Äpfel', erklaerung: 'ä' }
				]
			})
		]);
		expect(g.map((e) => e.wort)).toEqual(['Äpfel', 'Eingang', 'Zeta']);
	});

	it('das echte Glossar ist nicht leer', () => {
		expect(glossar(SYSTEM_THEMEN).length).toBeGreaterThan(0);
	});
});

describe('hilfeIdFuerPfad', () => {
	const themen = [...SYSTEM_THEMEN, thema('tasks.einstieg', 'Aufgaben')];
	const modulFuer = (p: string) =>
		p.startsWith('/tasks') ? 'tasks' : p.startsWith('/notes') ? 'notes' : undefined;

	it('nimmt das Einstiegsthema des Moduls, wenn es existiert', () => {
		expect(hilfeIdFuerPfad('/tasks', themen, modulFuer)).toBe('tasks.einstieg');
	});

	it('fällt ohne Einstiegsthema und ohne Modul auf „Was ist Life OS?“ zurück', () => {
		expect(hilfeIdFuerPfad('/notes', themen, modulFuer)).toBe('system.was-ist-life-os');
		expect(hilfeIdFuerPfad('/settings', themen, modulFuer)).toBe('system.was-ist-life-os');
	});

	it('Heute und die Rituale führen zum Thema Heute', () => {
		expect(hilfeIdFuerPfad('/', themen, modulFuer)).toBe('system.heute');
		expect(hilfeIdFuerPfad('/heute/planen', themen, modulFuer)).toBe('system.heute');
	});
});

describe('Sammeln und Gruppieren', () => {
	it('hängt die Modul-Themen an die System-Themen', () => {
		const t = sammleThemen([{ hilfe: [thema('tasks.einstieg', 'Aufgaben')] }, {}], SYSTEM_THEMEN);
		expect(findeThema(t, 'tasks.einstieg')?.titel).toBe('Aufgaben');
		expect(t).toHaveLength(SYSTEM_THEMEN.length + 1);
	});

	it('gruppiert System zuerst, dann je Modul', () => {
		const t = sammleThemen([{ hilfe: [thema('tasks.einstieg', 'Aufgaben')] }], SYSTEM_THEMEN);
		expect(gruppiereThemen(t).map((g) => g.gruppe)).toEqual(['system', 'tasks']);
	});
});
