import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	PROTOKOLL_MAX,
	PROTOKOLL_SCHLUESSEL,
	kappen,
	ladeProtokoll,
	loescheProtokoll,
	speichereProtokoll
} from './protokoll.js';
import type { ProtokollEintrag } from './types.js';

const eintrag = (
	n: number,
	status: ProtokollEintrag['status'] = 'ausgefuehrt'
): ProtokollEintrag => ({
	id: `e${n}`,
	zeit: '2026-10-07T10:00:00.000Z',
	regelId: 'sys:training-routine',
	regelTitel: 'Training hakt Routine ab',
	ausloeser: 'training.beendet',
	beschreibung: `Eintrag ${n}`,
	status
});

/** Minimaler localStorage-Ersatz — Vitest läuft in Node. */
function fakeStorage() {
	const daten = new Map<string, string>();
	return {
		getItem: (k: string) => daten.get(k) ?? null,
		setItem: (k: string, v: string) => void daten.set(k, v),
		removeItem: (k: string) => void daten.delete(k)
	};
}

beforeEach(() => {
	vi.stubGlobal('localStorage', fakeStorage());
});
afterEach(() => {
	vi.unstubAllGlobals();
});

describe('Protokoll', () => {
	it('kappt auf 200 Einträge und behält die neuesten (vorne)', () => {
		const liste = Array.from({ length: PROTOKOLL_MAX + 25 }, (_, i) => eintrag(i));
		const k = kappen(liste);
		expect(k).toHaveLength(PROTOKOLL_MAX);
		expect(k[0].id).toBe('e0');
	});

	it('speichert und lädt unter dem versionierten Schlüssel', () => {
		speichereProtokoll([eintrag(1), eintrag(2, 'fehler')]);
		expect(localStorage.getItem(PROTOKOLL_SCHLUESSEL)).not.toBeNull();
		expect(ladeProtokoll().map((e) => e.id)).toEqual(['e1', 'e2']);
	});

	it('liefert bei kaputtem JSON eine leere Liste', () => {
		localStorage.setItem(PROTOKOLL_SCHLUESSEL, '{kaputt');
		expect(ladeProtokoll()).toEqual([]);
	});

	it('verwirft Einträge mit unbekanntem Status oder fehlenden Feldern', () => {
		localStorage.setItem(
			PROTOKOLL_SCHLUESSEL,
			JSON.stringify([eintrag(1), { ...eintrag(2), status: 'komisch' }, { id: 'x' }, 'text', null])
		);
		expect(ladeProtokoll().map((e) => e.id)).toEqual(['e1']);
	});

	it('löscht das Protokoll beim Abmelden', () => {
		speichereProtokoll([eintrag(1)]);
		loescheProtokoll();
		expect(ladeProtokoll()).toEqual([]);
	});

	it('überlebt einen fehlenden localStorage', () => {
		vi.unstubAllGlobals();
		vi.stubGlobal('localStorage', undefined);
		expect(ladeProtokoll()).toEqual([]);
		expect(() => speichereProtokoll([eintrag(1)])).not.toThrow();
		expect(() => loescheProtokoll()).not.toThrow();
	});
});
