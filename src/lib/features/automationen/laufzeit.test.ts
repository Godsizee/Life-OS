import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aktionen } from '#lib/core/aktionen.js';
import { registriereSpeicher } from '#lib/core/einstellungen.js';
import { _alleHandlerEntfernen, emit } from '#lib/core/ereignisse.js';
import type { AktionDef } from '#lib/core/modul.js';
import { toastState } from '#lib/core/toast.svelte.js';
import { automationen, starteAutomationen } from './laufzeit.svelte.js';

const warte = () => new Promise((r) => setTimeout(r, 5));

let werte: Record<string, unknown>;
let stoppe: () => void;
const aufrufe: { id: string; parameter: Record<string, unknown>; ursache: unknown }[] = [];

function registriere(id: string, ergebnis: () => ReturnType<AktionDef['ausfuehren']>) {
	aktionen.setze(id, {
		titel: id,
		ausfuehren: (parameter, ursache) => {
			aufrufe.push({ id, parameter, ursache });
			return ergebnis();
		}
	});
}

const training = () =>
	emit('training.beendet', {
		logId: 'l1',
		planId: null,
		datum: '2026-10-07',
		dauerMin: 40,
		neueRekorde: [],
		trainingstageDieseWoche: 1
	});

beforeEach(() => {
	werte = {};
	aufrufe.length = 0;
	const speicher = new Map<string, string>();
	vi.stubGlobal('localStorage', {
		getItem: (k: string) => speicher.get(k) ?? null,
		setItem: (k: string, v: string) => void speicher.set(k, v),
		removeItem: (k: string) => void speicher.delete(k)
	});
	registriereSpeicher('nutzer', {
		lesen: (k) => werte[k],
		schreiben: async (patch) => {
			werte = { ...werte, ...patch };
		}
	});
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	automationen.leeren();
	for (const t of [...toastState.toasts]) toastState.dismiss(t.id);
	aktionen.leeren();
	stoppe = starteAutomationen({ modulAktiv: () => true, oeffneRegel: vi.fn() });
});

afterEach(() => {
	stoppe();
	_alleHandlerEntfernen();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('Modus auto', () => {
	beforeEach(() => {
		werte['automation.sys:training-routine'] = { parameter: { habitId: 'h1' } };
	});

	it('führt die Aktion mit Automation als Ursache aus und protokolliert sie', async () => {
		registriere('habits.abhaken', async () => ({
			geaendert: true,
			beschreibung: 'Sport abgehakt'
		}));
		training();
		await warte();

		expect(aufrufe).toHaveLength(1);
		expect(aufrufe[0].parameter).toEqual({ habitId: 'h1', datum: '2026-10-07' });
		expect(aufrufe[0].ursache).toEqual({
			art: 'automation',
			regelId: 'sys:training-routine',
			tiefe: 1
		});
		expect(automationen.protokoll[0]).toMatchObject({
			regelId: 'sys:training-routine',
			beschreibung: 'Sport abgehakt',
			status: 'ausgefuehrt',
			ausloeser: 'training.beendet'
		});
	});

	it('zeigt einen Toast mit Rückgängig und Warum? und macht es auf Wunsch rückgängig', async () => {
		const rueck = vi.fn(async () => {});
		registriere('habits.abhaken', async () => ({
			geaendert: true,
			beschreibung: 'Sport abgehakt',
			rueckgaengig: rueck
		}));
		training();
		await warte();

		const toast = toastState.toasts.find((t) => t.message === 'Sport abgehakt');
		expect(toast?.action?.label).toBe('Rückgängig');
		expect(toast?.zweiteAktion?.label).toBe('Warum?');

		toast?.action?.run();
		await warte();
		expect(rueck).toHaveBeenCalledOnce();
		expect(automationen.protokoll.find((e) => e.beschreibung === 'Sport abgehakt')?.status).toBe(
			'rueckgaengig'
		);
	});

	it('protokolliert „ohne Wirkung" ohne Toast', async () => {
		registriere('habits.abhaken', async () => ({
			geaendert: false,
			beschreibung: 'Sport war schon abgehakt'
		}));
		training();
		await warte();

		expect(automationen.protokoll[0].status).toBe('ohne-wirkung');
		expect(toastState.toasts).toHaveLength(0);
	});

	it('protokolliert einen Fehler still, ohne Toast, und zählt ihn', async () => {
		registriere('habits.abhaken', async () => {
			throw new Error('Server weg');
		});
		training();
		await warte();

		expect(automationen.protokoll[0]).toMatchObject({ status: 'fehler', fehler: 'Server weg' });
		expect(automationen.fehlerAnzahl).toBe(1);
		expect(toastState.toasts).toHaveLength(0);
	});

	it('tut nichts, wenn die Regel ausgeschaltet ist', async () => {
		werte['automation.sys:training-routine'] = { aktiv: false, parameter: { habitId: 'h1' } };
		registriere('habits.abhaken', async () => ({ geaendert: true, beschreibung: 'x' }));
		training();
		await warte();
		expect(aufrufe).toHaveLength(0);
	});

	it('tut nichts, wenn der Hauptschalter aus ist', async () => {
		werte['automation.alle'] = false;
		registriere('habits.abhaken', async () => ({ geaendert: true, beschreibung: 'x' }));
		training();
		await warte();
		expect(aufrufe).toHaveLength(0);
		expect(automationen.protokoll).toHaveLength(0);
	});

	it('lässt eine Regel ruhen, deren Aktion kein Modul anbietet', async () => {
		training(); // 'habits.abhaken' ist nicht registriert
		await warte();
		expect(aufrufe).toHaveLength(0);
		expect(automationen.protokoll).toHaveLength(0);
	});
});

describe('Modus fragen', () => {
	beforeEach(() => {
		registriere('mood.checkinAnbieten', async () => ({
			geaendert: true,
			beschreibung: 'Check-in angeboten'
		}));
	});

	it('legt einen Vorschlag an und führt erst nach „Ja" aus', async () => {
		training();
		await warte();

		expect(aufrufe).toHaveLength(0);
		expect(automationen.vorschlaege).toHaveLength(1);
		expect(automationen.protokoll[0].status).toBe('vorgeschlagen');
		const toast = toastState.toasts.find((t) => t.message.startsWith('Vorschlag:'));
		expect(toast?.action?.label).toBe('Ja');

		toast?.action?.run();
		await warte();
		expect(aufrufe).toHaveLength(1);
		expect(aufrufe[0].parameter).toEqual({ anlass: 'Training beendet' });
		expect(automationen.vorschlaege).toHaveLength(0);
		expect(automationen.protokoll[0].status).toBe('ausgefuehrt');
	});

	it('schlägt denselben Inhalt nicht zweimal vor', async () => {
		training();
		training();
		await warte();
		expect(automationen.vorschlaege).toHaveLength(1);
	});

	it('protokolliert eine Ablehnung', async () => {
		training();
		await warte();
		automationen.lehneAb(automationen.vorschlaege[0].id);
		expect(automationen.vorschlaege).toHaveLength(0);
		expect(automationen.protokoll[0].status).toBe('abgelehnt');
		expect(aufrufe).toHaveLength(0);
	});

	it('„Nie wieder" schaltet die Regel aus', async () => {
		training();
		await warte();
		await automationen.nieWieder(automationen.vorschlaege[0].id);
		expect(werte['automation.sys:training-checkin']).toEqual({ aktiv: false });

		training();
		await warte();
		expect(automationen.vorschlaege).toHaveLength(0);
	});
});

describe('Aufräumen', () => {
	it('leert Protokoll und Vorschläge beim Abmelden', async () => {
		registriere('mood.checkinAnbieten', async () => ({ geaendert: true, beschreibung: 'x' }));
		training();
		await warte();
		expect(automationen.protokoll.length).toBeGreaterThan(0);

		automationen.leeren();
		expect(automationen.protokoll).toEqual([]);
		expect(automationen.vorschlaege).toEqual([]);
		expect(localStorage.getItem('lifeos:automationen:protokoll:v1')).toBeNull();
	});
});
