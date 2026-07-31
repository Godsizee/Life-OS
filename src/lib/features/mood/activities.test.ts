import { describe, expect, it } from 'vitest';
import {
	ACTIVITY_CATALOG,
	activityLabel,
	cleanActivities,
	customActivities,
	customActivitiesWithCounts,
	groupedCatalog,
	isCatalogActivity,
	normalizeActivity,
	renameInList,
	toggleActivity
} from './activities';

describe('normalizeActivity', () => {
	it('trimmt, kleint und ersetzt Leerzeichen', () => {
		expect(normalizeActivity('  Gute Laune  ')).toBe('gute_laune');
	});
	it('entfernt fuehrende Rauten', () => {
		expect(normalizeActivity('#Sport')).toBe('sport');
	});
	it('behaelt Umlaute', () => {
		expect(normalizeActivity('Draußen')).toBe('draußen');
	});
	it('wirft Sonderzeichen weg', () => {
		expect(normalizeActivity('Kino!!! (2x)')).toBe('kino_2x');
	});
	it('kuerzt auf 24 Zeichen', () => {
		expect(normalizeActivity('a'.repeat(40))).toHaveLength(24);
	});
	it('gibt leeren String zurueck, wenn nichts uebrig bleibt', () => {
		expect(normalizeActivity('###')).toBe('');
		expect(normalizeActivity('   ')).toBe('');
	});
});

describe('Katalog', () => {
	it('hat eindeutige IDs', () => {
		const ids = ACTIVITY_CATALOG.map((a) => a.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
	it('hat nur normalisierte IDs', () => {
		for (const a of ACTIVITY_CATALOG) expect(normalizeActivity(a.id)).toBe(a.id);
	});
	it('ordnet jede Aktivitaet genau einer Gruppe zu', () => {
		const total = groupedCatalog().reduce((n, g) => n + g.activities.length, 0);
		expect(total).toBe(ACTIVITY_CATALOG.length);
	});
	it('erkennt Katalog- vs. eigene Tags', () => {
		expect(isCatalogActivity('sport')).toBe(true);
		expect(isCatalogActivity('bouldern')).toBe(false);
	});
});

describe('activityLabel', () => {
	it('nimmt das Katalog-Label', () => {
		expect(activityLabel('gut_geschlafen')).toBe('Gut geschlafen');
	});
	it('huebscht eigene Tags auf', () => {
		expect(activityLabel('brett_spiele')).toBe('Brett spiele');
	});
});

describe('toggleActivity', () => {
	it('fuegt hinzu und entfernt', () => {
		expect(toggleActivity([], 'sport')).toEqual(['sport']);
		expect(toggleActivity(['sport', 'arbeit'], 'sport')).toEqual(['arbeit']);
	});
	it('mutiert das Original nicht', () => {
		const src = ['sport'];
		toggleActivity(src, 'arbeit');
		expect(src).toEqual(['sport']);
	});
});

describe('cleanActivities', () => {
	it('entfernt Dubletten und Leeres, normalisiert', () => {
		expect(cleanActivities([' Sport ', 'sport', '', '###', 'Neuer Tag'])).toEqual([
			'sport',
			'neuer_tag'
		]);
	});
});

describe('customActivitiesWithCounts', () => {
	it('zählt nur Nicht-Katalog-Tags, absteigend', () => {
		const entries = [
			{ activities: ['sport', 'bouldern'] },
			{ activities: ['bouldern', 'yoga'] },
			{ activities: ['bouldern'] },
			{ activities: null }
		];
		expect(customActivitiesWithCounts(entries)).toEqual([
			{ tag: 'bouldern', count: 3 },
			{ tag: 'yoga', count: 1 }
		]);
	});
});

describe('renameInList', () => {
	it('benennt um', () => {
		expect(renameInList(['sport', 'arbeit'], 'sport', 'laufen').sort()).toEqual(['arbeit', 'laufen']);
	});
	it('entfernt bei null', () => {
		expect(renameInList(['sport', 'arbeit'], 'sport', null)).toEqual(['arbeit']);
	});
	it('erzeugt keine Dublette, wenn das Ziel schon vorhanden ist', () => {
		expect(renameInList(['sport', 'laufen'], 'sport', 'laufen')).toEqual(['laufen']);
	});
	it('lässt Listen ohne den Tag unverändert', () => {
		expect(renameInList(['arbeit'], 'sport', 'laufen')).toEqual(['arbeit']);
	});
});

