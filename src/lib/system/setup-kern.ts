import type { ModulId, ModulMeta, SetupAbsicht } from '#lib/config/modules.js';

export interface AbsichtInfo {
	id: SetupAbsicht;
	label: string;
	/** Ein Satz, was dahinter steckt. */
	kurz: string;
	/** Modulfarbe der Karte. */
	modul: ModulId;
}

/** Auswahl im ersten Schritt. „Später entscheiden“ ist keine Absicht, sondern die leere Auswahl. */
export const ABSICHTEN: AbsichtInfo[] = [
	{
		id: 'tag-planen',
		label: 'Meinen Tag planen',
		kurz: 'Aufgaben, Termine und freie Zeit an einem Ort.',
		modul: 'tasks'
	},
	{
		id: 'befinden',
		label: 'Mein Befinden im Blick',
		kurz: 'Stimmung, Schlaf und Tagebuch festhalten.',
		modul: 'mood'
	},
	{
		id: 'routinen',
		label: 'Routinen aufbauen',
		kurz: 'Kleine Gewohnheiten, die zu deinem Alltag passen.',
		modul: 'habits'
	},
	{
		id: 'haushalt',
		label: 'Gemeinsam haushalten',
		kurz: 'Einkauf, Termine und Aufgaben mit anderen teilen.',
		modul: 'shopping'
	},
	{
		id: 'fitness',
		label: 'Fit werden',
		kurz: 'Training planen und den Verlauf sehen.',
		modul: 'fitness'
	},
	{
		id: 'wissen',
		label: 'Wissen sammeln',
		kurz: 'Notizen und Ideen ablegen und wiederfinden.',
		modul: 'notes'
	}
];

/** Module, die der Assistent einschaltet: Standardmodule plus die, die zu einer gewählten Absicht passen. */
export function vorschauModule(absichten: SetupAbsicht[], alle: ModulMeta[]): ModulId[] {
	return alle
		.filter((m) => m.pflicht || m.standardAktiv || m.absichten.some((a) => absichten.includes(a)))
		.map((m) => m.id);
}

export type FrageId = 'tagesfenster' | 'routine' | 'haushalt' | 'fitness';

/** Je Absicht höchstens eine Frage (in der Reihenfolge der Absichten); gestellt werden höchstens drei. */
const FRAGE_ZU_ABSICHT: Partial<Record<SetupAbsicht, FrageId>> = {
	'tag-planen': 'tagesfenster',
	routinen: 'routine',
	haushalt: 'haushalt',
	fitness: 'fitness'
};

export function fragenFuer(absichten: SetupAbsicht[]): FrageId[] {
	const fragen: FrageId[] = [];
	for (const a of ABSICHTEN.map((x) => x.id)) {
		const f = FRAGE_ZU_ABSICHT[a];
		if (f && absichten.includes(a)) fragen.push(f);
	}
	return fragen.slice(0, 3);
}

export interface RoutinenVorlage {
	id: string;
	name: string;
	/** Mengen-Ziel; ohne Wert eine Häkchen-Routine. */
	ziel?: { menge: number; einheit: string };
}

export const ROUTINEN_VORLAGEN: RoutinenVorlage[] = [
	{ id: 'lesen', name: 'Lesen 10 min' },
	{ id: 'wasser', name: 'Wasser trinken', ziel: { menge: 8, einheit: 'Gläser' } },
	{ id: 'spaziergang', name: 'Spaziergang' },
	{ id: 'dehnen', name: 'Dehnen' }
];

/** Datum aus `setup.abgeschlossen`. Leer bei fehlendem Wert und bei übernommenen Bestandskonten (`bestand-…`). */
export function setupDatum(wert: string): string {
	return /^\d{4}-\d{2}-\d{2}$/.test(wert) ? wert : '';
}

/** Muss der Assistent erscheinen? Nur wenn gar kein Wert vorliegt. */
export function setupSteht(wert: string): boolean {
	return wert === '';
}

export interface SchrittKontext {
	setupDatum: string;
	absichten: SetupAbsicht[];
	ritualeAn: boolean;
	tagGeplant: boolean;
	/** Aufgabe oder Notiz seit dem Setup-Datum angelegt. */
	festgehalten: boolean;
	routinenAktiv: boolean;
	routinen: number;
	stimmungAktiv: boolean;
	gesundheitAktiv: boolean;
	checkins: number;
	mitglieder: number;
	pushAktiv: boolean;
	installiert: boolean;
}

export interface ErsterSchritt {
	id: string;
	titel: string;
	erledigt: boolean;
	/** Direkte Aktion für den offenen Eintrag. */
	href: string;
	aktion: string;
	/** Hilfethema „Wie geht das?“. */
	hilfe: string;
}

/** „Erste Schritte“ werden aus Daten gelesen, nie abgehakt. Nicht zutreffende Einträge fehlen in der Liste. */
export function ersteSchritte(k: SchrittKontext): ErsterSchritt[] {
	const liste: ErsterSchritt[] = [];
	if (k.ritualeAn) {
		liste.push({
			id: 'tag-geplant',
			titel: 'Ersten Tag geplant',
			erledigt: k.tagGeplant,
			href: '/heute/planen',
			aktion: 'Tag planen',
			hilfe: 'system.rituale'
		});
	}
	liste.push({
		id: 'festgehalten',
		titel: 'Etwas festgehalten',
		erledigt: k.festgehalten,
		href: '/?erfassen=1',
		aktion: 'Erfassen',
		hilfe: 'system.erfassen'
	});
	if (k.routinenAktiv) {
		liste.push({
			id: 'routine',
			titel: 'Erste Routine angelegt',
			erledigt: k.routinen > 0,
			href: '/habits',
			aktion: 'Routine anlegen',
			hilfe: 'system.module'
		});
	}
	if (k.stimmungAktiv || k.gesundheitAktiv) {
		liste.push({
			id: 'checkin',
			titel: 'Erster Check-in',
			erledigt: k.checkins > 0,
			href: k.stimmungAktiv ? '/mood' : '/health',
			aktion: 'Check-in',
			hilfe: 'system.heute'
		});
	}
	if (k.absichten.includes('haushalt')) {
		liste.push({
			id: 'haushalt',
			titel: 'Haushalt eingeladen',
			erledigt: k.mitglieder > 1,
			href: '/settings',
			aktion: 'Einladen',
			hilfe: 'system.geteilt-persoenlich'
		});
	}
	liste.push(
		{
			id: 'erinnerungen',
			titel: 'Erinnerungen aktiviert',
			erledigt: k.pushAktiv,
			href: '/settings',
			aktion: 'Aktivieren',
			hilfe: 'system.hinweise'
		},
		{
			id: 'installiert',
			titel: 'App installiert',
			erledigt: k.installiert,
			href: '/settings',
			aktion: 'Installieren',
			hilfe: 'system.offline'
		}
	);
	return liste;
}

/** Das Widget bleibt, solange etwas offen ist und die Person es nicht ausgeblendet hat. */
export function zeigeErsteSchritte(liste: ErsterSchritt[], ausgeblendet: boolean): boolean {
	return !ausgeblendet && liste.some((s) => !s.erledigt);
}
