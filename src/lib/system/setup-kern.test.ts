import { describe, expect, it } from 'vitest';
import { modules } from '#lib/config/modules.js';
import {
	ABSICHTEN,
	ersteSchritte,
	fragenFuer,
	setupDatum,
	setupSteht,
	vorschauModule,
	zeigeErsteSchritte,
	type SchrittKontext
} from './setup-kern.js';

const KONTEXT: SchrittKontext = {
	setupDatum: '2026-10-09',
	absichten: [],
	ritualeAn: true,
	tagGeplant: false,
	festgehalten: false,
	routinenAktiv: true,
	routinen: 0,
	stimmungAktiv: true,
	gesundheitAktiv: false,
	checkins: 0,
	mitglieder: 1,
	pushAktiv: false,
	installiert: false
};

describe('Setup: Vorschau der Module', () => {
	it('ohne Absicht gelten die Standardmodule samt Pflichtmodulen', () => {
		const ids = vorschauModule([], modules);
		for (const m of modules.filter((x) => x.pflicht || x.standardAktiv))
			expect(ids).toContain(m.id);
		expect(ids).not.toContain('fitness');
	});

	it('eine Absicht schaltet die passenden Module dazu', () => {
		const ids = vorschauModule(['fitness'], modules);
		expect(ids).toContain('fitness');
		for (const m of modules.filter((x) => x.absichten.includes('fitness'))) {
			expect(ids).toContain(m.id);
		}
	});

	it('jede Absicht hat eine Karte und mindestens ein zugehöriges Modul', () => {
		for (const a of ABSICHTEN) {
			expect(modules.some((m) => m.absichten.includes(a.id))).toBe(true);
		}
	});
});

describe('Setup: Fragen', () => {
	it('stellt nur Fragen zu gewählten Absichten', () => {
		expect(fragenFuer([])).toEqual([]);
		expect(fragenFuer(['wissen', 'befinden'])).toEqual([]);
		expect(fragenFuer(['fitness', 'tag-planen'])).toEqual(['tagesfenster', 'fitness']);
	});

	it('stellt höchstens drei Fragen', () => {
		expect(fragenFuer(['tag-planen', 'routinen', 'haushalt', 'fitness'])).toEqual([
			'tagesfenster',
			'routine',
			'haushalt'
		]);
	});
});

describe('Setup: Wert „abgeschlossen“', () => {
	it('liest nur echte Daten als Setup-Datum', () => {
		expect(setupDatum('2026-10-09')).toBe('2026-10-09');
		expect(setupDatum('bestand-2026-10-08')).toBe('');
		expect(setupDatum('')).toBe('');
	});

	it('der Assistent erscheint nur bei fehlendem Wert, nie bei Bestandskonten', () => {
		expect(setupSteht('')).toBe(true);
		expect(setupSteht('bestand-2026-10-08')).toBe(false);
		expect(setupSteht('2026-10-09')).toBe(false);
	});
});

describe('Erste Schritte', () => {
	const ids = (k: SchrittKontext) => ersteSchritte(k).map((s) => s.id);

	it('listet nur zutreffende Einträge', () => {
		expect(ids(KONTEXT)).toEqual([
			'tag-geplant',
			'festgehalten',
			'routine',
			'checkin',
			'erinnerungen',
			'installiert'
		]);
		expect(
			ids({
				...KONTEXT,
				ritualeAn: false,
				routinenAktiv: false,
				stimmungAktiv: false,
				absichten: ['haushalt']
			})
		).toEqual(['festgehalten', 'haushalt', 'erinnerungen', 'installiert']);
	});

	it('liest Erledigtes aus Daten', () => {
		const k: SchrittKontext = {
			...KONTEXT,
			tagGeplant: true,
			routinen: 2,
			checkins: 1,
			absichten: ['haushalt'],
			mitglieder: 2,
			installiert: true
		};
		const erledigt = Object.fromEntries(ersteSchritte(k).map((s) => [s.id, s.erledigt]));
		expect(erledigt).toMatchObject({
			'tag-geplant': true,
			festgehalten: false,
			routine: true,
			checkin: true,
			haushalt: true,
			erinnerungen: false,
			installiert: true
		});
	});

	it('Check-in führt zur Gesundheit, wenn die Stimmung aus ist', () => {
		const s = ersteSchritte({ ...KONTEXT, stimmungAktiv: false, gesundheitAktiv: true });
		expect(s.find((x) => x.id === 'checkin')?.href).toBe('/health');
	});

	it('das Widget verschwindet, wenn alles erledigt oder ausgeblendet ist', () => {
		const offen = ersteSchritte(KONTEXT);
		expect(zeigeErsteSchritte(offen, false)).toBe(true);
		expect(zeigeErsteSchritte(offen, true)).toBe(false);
		expect(
			zeigeErsteSchritte(
				offen.map((s) => ({ ...s, erledigt: true })),
				false
			)
		).toBe(false);
	});
});
