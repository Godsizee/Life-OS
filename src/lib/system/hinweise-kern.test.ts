import { describe, expect, it, vi } from 'vitest';
import type { Hinweis } from '#lib/core/modul.js';
import { sammleHinweiseIn, type HinweisOptionen } from './hinweise-kern';
import { hinweisArtDefs } from './einstellungen/hinweise';

const JETZT = new Date(2026, 9, 8, 19, 0);
const h = (id: string, art: string, prioritaet: number): Hinweis => ({
	id,
	art,
	titel: id,
	text: '',
	warum: { was: '', warumJetzt: '', daten: [], steuerung: [] },
	prioritaet
});
const modul = (...hinweise: Hinweis[]) => ({ id: 'tasks' as const, hinweise: () => hinweise });
const optionen = (p: Partial<HinweisOptionen> = {}): HinweisOptionen => ({
	jetzt: JETZT,
	artAktiv: () => true,
	schlummer: {},
	leiserTag: false,
	max: 2,
	...p
});

describe('sammleHinweiseIn', () => {
	it('sortiert nach Priorität und begrenzt auf max', () => {
		const r = sammleHinweiseIn(
			[modul(h('a', 'x.a', 10), h('b', 'x.b', 80), h('c', 'x.c', 50))],
			optionen()
		);
		expect(r.map((x) => x.id)).toEqual(['b', 'c']);
	});

	it('max 0 zeigt nichts', () => {
		expect(sammleHinweiseIn([modul(h('a', 'x.a', 10))], optionen({ max: 0 }))).toEqual([]);
	});

	it('ohne Auslöser kommt nichts — keine Schein-Belobigung', () => {
		expect(sammleHinweiseIn([modul()], optionen())).toEqual([]);
	});

	it('filtert abgeschaltete Arten', () => {
		const r = sammleHinweiseIn(
			[modul(h('a', 'x.aus', 90), h('b', 'x.an', 10))],
			optionen({ artAktiv: (art) => art !== 'x.aus' })
		);
		expect(r.map((x) => x.id)).toEqual(['b']);
	});

	it('lässt zurückgestellte ruhen, bis die Zeit um ist', () => {
		const spaeter = new Date(2026, 9, 9).toISOString();
		const frueher = new Date(2026, 9, 7).toISOString();
		const m = [modul(h('a', 'x.a', 50), h('b', 'x.b', 40))];
		expect(sammleHinweiseIn(m, optionen({ schlummer: { a: spaeter } })).map((x) => x.id)).toEqual([
			'b'
		]);
		expect(sammleHinweiseIn(m, optionen({ schlummer: { a: frueher } })).map((x) => x.id)).toEqual([
			'a',
			'b'
		]);
	});

	it('leiser Tag lässt nur sehr wichtige Hinweise durch', () => {
		const r = sammleHinweiseIn(
			[modul(h('a', 'x.a', 89), h('b', 'x.b', 90))],
			optionen({ leiserTag: true })
		);
		expect(r.map((x) => x.id)).toEqual(['b']);
	});

	it('ein werfendes Modul verdeckt die übrigen nicht', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const kaputt = {
			id: 'notes' as const,
			hinweise: () => {
				throw new Error('kaputt');
			}
		};
		expect(sammleHinweiseIn([kaputt, modul(h('a', 'x.a', 10))], optionen())).toHaveLength(1);
	});
});

describe('hinweisArtDefs', () => {
	it('erzeugt je Art einen Schalter mit dem Standard des Moduls', () => {
		const defs = hinweisArtDefs([
			{
				hinweisArten: [
					{ art: 'journal.pause', titel: 'Pause', bedingung: 'b', standardAktiv: false },
					{ art: 'tasks.frist-verpasst', titel: 'Frist', bedingung: 'b', standardAktiv: true }
				]
			},
			{}
		]);
		expect(defs.map((d) => [d.schluessel, d.standard])).toEqual([
			['hinweis.journal.pause.aktiv', false],
			['hinweis.tasks.frist-verpasst.aktiv', true]
		]);
	});
});
