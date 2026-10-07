import { toISODate } from '#lib/core/date.js';
import type { LifeEvent } from '#lib/core/ereignisse.js';
import type { LifeEventType } from '#lib/config/ereignisse.js';
import { DEFAULT_GLASS_SIZE_ML } from '#lib/features/profile/units.js';
import type { Regel } from './types.js';

/** Lokaler Kalendertag des Ereignisses — plane() bleibt rein und braucht keine Uhr. */
const tagVon = (e: LifeEvent<LifeEventType>) => toISODate(new Date(e.zeit));

const zahl = (v: unknown): number | null => {
	const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
	return Number.isFinite(n) ? n : null;
};

export const aufgabeRoutineName: Regel<'aufgabe.erledigt'> = {
	id: 'sys:aufgabe-routine-name',
	titel: 'Aufgabe hakt gleichnamige Routine ab',
	erklaerung:
		'WENN du eine Aufgabe erledigst, DANN wird die Routine mit demselben Namen für heute abgehakt.',
	ausloeser: 'aufgabe.erledigt',
	module: ['tasks', 'habits'],
	standard: { aktiv: true, modus: 'auto', parameter: {} },
	plane: (e) =>
		e.daten.titel.trim()
			? [{ aktion: 'habits.abhakenNachName', parameter: { name: e.daten.titel, datum: tagVon(e) } }]
			: []
};

export const trainingRoutine: Regel<'training.beendet'> = {
	id: 'sys:training-routine',
	titel: 'Training hakt Routine ab',
	erklaerung: 'WENN du ein Training beendest, DANN wird die gewählte Routine für heute abgehakt.',
	ausloeser: 'training.beendet',
	module: ['fitness', 'habits'],
	standard: { aktiv: true, modus: 'auto', parameter: { habitId: null } },
	parameterFelder: [{ schluessel: 'habitId', label: 'Routine', art: 'routine' }],
	plane: (e, p) =>
		typeof p.habitId === 'string' && p.habitId
			? [{ aktion: 'habits.abhaken', parameter: { habitId: p.habitId, datum: e.daten.datum } }]
			: []
};

export const rekordZiel: Regel<'training.beendet'> = {
	id: 'sys:rekord-ziel',
	titel: 'Neuer Rekord schreibt Rekord-Ziele fort',
	erklaerung:
		'WENN du bei einem Training einen neuen Rekord aufstellst, DANN wird jedes Rekord-Ziel für diese Übung fortgeschrieben.',
	ausloeser: 'training.beendet',
	module: ['fitness', 'goals'],
	standard: { aktiv: true, modus: 'auto', parameter: {} },
	plane: (e) =>
		e.daten.neueRekorde.map((r) => ({
			aktion: 'goals.rekordUebernehmen',
			parameter: { uebung: r.uebung, e1rmKg: r.e1rmKg }
		}))
};

export const frequenzZiel: Regel<'training.beendet'> = {
	id: 'sys:frequenz-ziel',
	titel: 'Training schreibt Frequenz-Ziele fort',
	erklaerung:
		'WENN du ein Training beendest, DANN wird jedes Trainings-Häufigkeitsziel mit den Trainingstagen dieser Woche fortgeschrieben.',
	ausloeser: 'training.beendet',
	module: ['fitness', 'goals'],
	standard: { aktiv: true, modus: 'auto', parameter: {} },
	plane: (e) => [
		{
			aktion: 'goals.frequenzSetzen',
			parameter: { trainingstage: e.daten.trainingstageDieseWoche, datum: e.daten.datum }
		}
	]
};

export const wasserRoutine: Regel<'gesundheit.erfasst'> = {
	id: 'sys:wasser-routine',
	titel: 'Getrunkenes Wasser zählt in der Wasser-Routine',
	erklaerung:
		'WENN du Wasser einträgst, DANN wird die Mengen-Routine um die entsprechende Anzahl Einheiten erhöht.',
	ausloeser: 'gesundheit.erfasst',
	module: ['health', 'habits'],
	standard: {
		aktiv: false,
		modus: 'auto',
		parameter: { habitId: null, mlProEinheit: DEFAULT_GLASS_SIZE_ML }
	},
	parameterFelder: [
		{ schluessel: 'habitId', label: 'Routine', art: 'routine' },
		{
			schluessel: 'mlProEinheit',
			label: 'Milliliter pro Einheit',
			art: 'zahl',
			hinweis: 'Ein Glas Wasser = 250 ml.'
		}
	],
	plane: (e, p) => {
		const ml = zahl(p.mlProEinheit);
		if (typeof p.habitId !== 'string' || !p.habitId || !ml || ml <= 0) return [];
		if (e.daten.wasserMlDelta <= 0) return [];
		// Die Aktion zählt für HEUTE — ein nachgetragener Tag darf nicht in die heutige Routine fließen.
		if (e.daten.datum !== tagVon(e)) return [];
		const menge = Math.round(e.daten.wasserMlDelta / ml);
		return menge > 0
			? [{ aktion: 'habits.mengeErhoehen', parameter: { habitId: p.habitId, menge } }]
			: [];
	}
};

export const trainingCheckin: Regel<'training.beendet'> = {
	id: 'sys:training-checkin',
	titel: 'Nach dem Training nach der Stimmung fragen',
	erklaerung: 'WENN du ein Training beendest, DANN fragt Life OS, wie du dich fühlst.',
	ausloeser: 'training.beendet',
	module: ['fitness', 'mood'],
	standard: { aktiv: true, modus: 'fragen', parameter: {} },
	plane: () => [{ aktion: 'mood.checkinAnbieten', parameter: { anlass: 'Training beendet' } }]
};

export const tiefLeiserTag: Regel<'stimmung.erfasst'> = {
	id: 'sys:tief-leiser-tag',
	titel: 'Nach tiefen Tagen einen leisen Tag vorschlagen',
	erklaerung:
		'WENN deine Stimmung mehrere Tage in Folge tief war, DANN schlägt Life OS einen leisen Tag mit weniger Hinweisen vor.',
	ausloeser: 'stimmung.erfasst',
	module: ['mood'],
	standard: { aktiv: true, modus: 'fragen', parameter: { tage: 3 } },
	parameterFelder: [
		{
			schluessel: 'tage',
			label: 'Tiefe Tage in Folge',
			art: 'zahl',
			hinweis: 'Ab wie vielen Tagen?'
		}
	],
	plane: (e, p) => {
		const tage = zahl(p.tage) ?? 3;
		// Ein nachgetragener Tag soll keinen Vorschlag für HEUTE auslösen.
		if (e.daten.datum !== tagVon(e)) return [];
		return e.daten.tiefeTageInFolge >= tage ? [{ aktion: 'system.leiserTag', parameter: {} }] : [];
	}
};

export const abschlussTagebuch: Regel<'tag.abgeschlossen'> = {
	id: 'sys:abschluss-tagebuch',
	titel: 'Tagesabschluss schreibt den Rückblick ins Tagebuch',
	erklaerung:
		'WENN du den Tag abschließt, DANN werden die erledigten Aufgaben als Rückblick an den Tagebucheintrag gehängt.',
	ausloeser: 'tag.abgeschlossen',
	module: ['journal', 'tasks'],
	standard: { aktiv: false, modus: 'fragen', parameter: {} },
	plane: (e) =>
		e.daten.erledigteAufgaben.length > 0
			? [
					{
						aktion: 'journal.rueckblickAnhaengen',
						parameter: { datum: e.daten.datum, aufgaben: e.daten.erledigteAufgaben }
					}
				]
			: []
};

export const REGELN: Regel[] = [
	aufgabeRoutineName,
	trainingRoutine,
	rekordZiel,
	frequenzZiel,
	wasserRoutine,
	trainingCheckin,
	tiefLeiserTag,
	abschlussTagebuch
];
