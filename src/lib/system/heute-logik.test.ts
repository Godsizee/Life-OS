import { describe, expect, it } from 'vitest';
import type { AgendaEintrag } from '#lib/core/modul.js';
import { baueTagesplan } from './agenda.js';
import { idAusKey, ohneZurueckgestellte, stelleZurueck, ueberbuchtUm } from './heute-logik.js';

const JETZT = new Date(2026, 9, 7, 10, 0);
const FENSTER = { beginn: new Date(2026, 9, 7, 8), ende: new Date(2026, 9, 7, 20) };
const e = (key: string, teil: Partial<AgendaEintrag> = {}): AgendaEintrag => ({
	key,
	modul: 'tasks',
	art: 'aufgabe',
	titel: key,
	start: null,
	ende: null,
	dauerMin: null,
	erledigt: false,
	href: '/',
	warum: '',
	...teil
});

describe('stelleZurueck', () => {
	it('hängt den Eintrag mit 2 Stunden Frist an und räumt Abgelaufenes auf', () => {
		const alt = [{ key: 'alt', bis: new Date(2026, 9, 7, 9).toISOString() }];
		const neu = stelleZurueck(alt, 'a', JETZT);
		expect(neu).toHaveLength(1);
		expect(neu[0].key).toBe('a');
		expect(new Date(neu[0].bis).getHours()).toBe(12);
	});

	it('ersetzt einen bereits zurückgestellten Eintrag, statt ihn doppelt zu führen', () => {
		const eins = stelleZurueck([], 'a', JETZT);
		expect(stelleZurueck(eins, 'a', new Date(2026, 9, 7, 11))).toHaveLength(1);
	});
});

describe('ohneZurueckgestellte', () => {
	const plan = baueTagesplan(
		[e('a'), e('b'), e('c', { start: new Date(2026, 9, 7, 14) })],
		FENSTER,
		30
	);

	it('blendet zurückgestellte Einträge in beiden Listen aus', () => {
		const liste = [
			{ key: 'a', bis: new Date(2026, 9, 7, 12).toISOString() },
			{ key: 'c', bis: new Date(2026, 9, 7, 12).toISOString() }
		];
		const r = ohneZurueckgestellte(plan, liste, JETZT);
		expect(r.flexibel.map((x) => x.key)).toEqual(['b']);
		expect(r.zeitlich).toEqual([]);
	});

	it('zeigt Einträge wieder, sobald die Zeit abgelaufen ist', () => {
		const liste = [{ key: 'a', bis: new Date(2026, 9, 7, 9).toISOString() }];
		expect(ohneZurueckgestellte(plan, liste, JETZT)).toBe(plan);
	});

	it('lässt die Kapazität unverändert', () => {
		const liste = [{ key: 'a', bis: new Date(2026, 9, 7, 12).toISOString() }];
		expect(ohneZurueckgestellte(plan, liste, JETZT).kapazitaet).toBe(plan.kapazitaet);
	});
});

describe('idAusKey', () => {
	it('liest die Id nur beim passenden Modul', () => {
		expect(idAusKey('tasks:abc', 'tasks')).toBe('abc');
		expect(idAusKey('habits:h1:2026-10-07', 'habits')).toBe('h1');
		expect(idAusKey('calendar:x', 'tasks')).toBeNull();
	});
});

describe('ueberbuchtUm', () => {
	it('nennt die Minuten über der freien Zeit', () => {
		const plan = baueTagesplan([e('a', { dauerMin: 800 })], FENSTER, 30);
		expect(ueberbuchtUm(plan)).toBe(80);
	});

	it('ist 0 ohne Überbuchung', () => {
		expect(ueberbuchtUm(baueTagesplan([e('a', { dauerMin: 60 })], FENSTER, 30))).toBe(0);
	});
});
