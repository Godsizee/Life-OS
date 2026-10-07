import { toISODate, fromISODate } from '#lib/core/date.js';
import type { Ursache } from '#lib/core/ereignisse.js';
import type { AktionDef, AktionErgebnis } from '#lib/core/modul.js';
import { toastState } from '#lib/core/toast.svelte.js';
import { rueckblickAnhaengen } from './rueckblick.js';
import { goalsState } from './store.svelte.js';
import {
	frequenzAenderungen,
	rekordAenderungen,
	type FortschrittsAenderung
} from './training-fortschritt.js';

const text = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Schreibt die Änderungen, meldet erreichte Ziele und bietet das Zurücksetzen auf die alten Werte an. */
async function setzeFortschritt(
	aenderungen: FortschrittsAenderung[],
	beschreibung: (a: FortschrittsAenderung) => string,
	leer: string
): Promise<AktionErgebnis> {
	if (aenderungen.length === 0) return { geaendert: false, beschreibung: leer };
	for (const a of aenderungen) {
		await goalsState.updateProgress(a.id, a.neu);
		if (a.neu >= 100) toastState.success(`🎯 Ziel „${a.titel}" erreicht!`);
	}
	return {
		geaendert: true,
		beschreibung: aenderungen.map(beschreibung).join(' · '),
		rueckgaengig: async () => {
			for (const a of aenderungen) await goalsState.updateProgress(a.id, a.alt);
		}
	};
}

export const goalsAktionen: Record<string, AktionDef> = {
	'goals.rekordUebernehmen': {
		titel: 'Rekord ins Ziel übernehmen',
		ausfuehren: (p) =>
			setzeFortschritt(
				rekordAenderungen(goalsState.goals, text(p.uebung), Number(p.e1rmKg)),
				(a) => `Ziel „${a.titel}" auf ${a.neu} % gesetzt`,
				'Kein Rekord-Ziel zu dieser Übung kommt voran'
			)
	},

	'goals.frequenzSetzen': {
		titel: 'Trainingshäufigkeit ins Ziel übernehmen',
		ausfuehren: (p) =>
			setzeFortschritt(
				frequenzAenderungen(
					goalsState.goals,
					Number(p.trainingstage),
					fromISODate(text(p.datum)) ?? new Date()
				),
				(a) => `Ziel „${a.titel}" auf ${a.neu} % gesetzt`,
				'Kein Häufigkeitsziel kommt voran'
			)
	}
};

export const journalAktionen: Record<string, AktionDef> = {
	'journal.rueckblickAnhaengen': {
		titel: 'Rückblick ins Tagebuch schreiben',
		ausfuehren: async (p, ursache: Ursache): Promise<AktionErgebnis> => {
			const datum = text(p.datum) || toISODate(new Date());
			const aufgaben = Array.isArray(p.aufgaben)
				? p.aufgaben.filter((a): a is string => typeof a === 'string')
				: [];
			const vorher = goalsState.entryForDate(datum);
			const neu = rueckblickAnhaengen(vorher?.body ?? '', aufgaben);
			if (neu === null) {
				return { geaendert: false, beschreibung: 'Der Rückblick steht schon im Tagebuch' };
			}
			await goalsState.saveJournalEntry(datum, vorher?.mood ?? null, neu, null, 'daily', ursache);
			return {
				geaendert: true,
				beschreibung: `${aufgaben.length} erledigte Aufgaben ins Tagebuch geschrieben`,
				rueckgaengig: async () => {
					if (vorher) {
						await goalsState.saveJournalEntry(datum, vorher.mood, vorher.body, null, 'daily');
						return;
					}
					const angelegt = goalsState.entryForDate(datum);
					if (angelegt) await goalsState.removeJournalEntry(angelegt.id);
				}
			};
		}
	}
};
