import type { Component } from 'svelte';
import type { ModulId } from '#lib/config/modules.js';
import type { IconKomponente } from '#lib/ui/icon.js';
import type { EinstellungDef } from './einstellungen.js';
import type { Ursache } from './ereignisse.js';

export interface StoreLebenszyklus {
	laden(workspaceId: string): Promise<void>;
	neuLaden(workspaceId: string): Promise<void>;
	entladen(): void;
	/** optional: nach dem Laden ALLER Stores (z. B. Fokus-Session wiederherstellen) */
	nachDemLaden?(): void;
}

export interface SuchTreffer {
	id: string;
	modul: ModulId;
	titel: string;
	untertitel?: string;
	href: string;
	/** 0..1, Standard 0.5 — höher steht weiter oben */
	gewicht?: number;
}

export interface ErfassenVorschau {
	/** „Termin“, „Aufgabe“ … */
	art: string;
	/** [{ label: 'Wann', wert: 'Mo 10:00' }] */
	felder: { label: string; wert: string }[];
	/** 0..1; < 0.5 → Rückfrage statt Ausführen */
	sicherheit: number;
	/** modulintern, für ausfuehren() */
	daten: unknown;
}
export interface ErfassenArt {
	id: string;
	label: string;
	/** erscheinen im Erfassen-Blatt unter „So kannst du schreiben“ */
	beispiele: string[];
	erkennen(text: string, jetzt: Date): ErfassenVorschau | null;
	/** liefert die Erfolgsmeldung */
	ausfuehren(vorschau: ErfassenVorschau): Promise<string>;
}

export type WidgetGroesse = 's' | 'm' | 'l';
export interface WidgetDef {
	/** '<modul>.<name>', z. B. 'tasks.wochenfokus' */
	id: string;
	titel: string;
	/** ein Satz: was zeigt es, woher kommen die Daten */
	erklaerung: string;
	groessen: WidgetGroesse[];
	/** lazy! */
	komponente: () => Promise<{ default: Component<{ groesse: WidgetGroesse }> }>;
}

/** Die fünf Fragen jeder Erklärung (Recherche „Explainable recommendations“). */
export interface Erklaerung {
	/** „Aufgabe ‚Steuer‘ auf morgen verschieben?“ */
	was: string;
	/** „Dein Plan übersteigt die freie Zeit um 75 min.“ */
	warumJetzt: string;
	/** ['Kalender: 3 Termine (2 h 30)', …] */
	daten: string[];
	/** „Beobachtung über 14 Tage, 9 Vergleichstage“ */
	staerke?: string;
	/** ['Diese Art Hinweis abschalten' → /settings#hinweise] */
	steuerung: { label: string; href: string }[];
}

export interface Hinweis {
	/** stabil: '<art>:<objekt-id>' */
	id: string;
	/** Schalter-Schlüssel '<modul>.<name>' */
	art: string;
	titel: string;
	text: string;
	warum: Erklaerung;
	aktion?: { label: string; href?: string; ausfuehren?: () => Promise<void> };
	/** 0..100 */
	prioritaet: number;
}

export interface ScoreBeitrag {
	label: string;
	/** null = keine Daten bzw. nicht anwendbar → zählt an diesem Tag NICHT (kein Strafpunkt) */
	berechne(datum: string): number | null;
	/** „4 von 5 geplanten Aufgaben erledigt“ */
	erklaerung(datum: string): string;
}

export interface AgendaEintrag {
	key: string;
	modul: ModulId;
	art: 'termin' | 'aufgabe' | 'routine' | 'erinnerung' | 'training' | 'fokus';
	titel: string;
	start: Date | null;
	ende: Date | null;
	dauerMin: number | null;
	ganztags?: boolean;
	erledigt: boolean;
	href: string;
	/** „Für heute geplant“, „Frist heute“, „Routine: Mo, Mi, Fr“ */
	warum: string;
}

export interface AktionErgebnis {
	geaendert: boolean;
	/** „Routine ‚Sport‘ für heute abgehakt“ */
	beschreibung: string;
	rueckgaengig?: () => Promise<void>;
}
export interface AktionDef {
	titel: string;
	ausfuehren(parameter: Record<string, unknown>, ursache: Ursache): Promise<AktionErgebnis>;
}

export interface VerknuepfbarDef {
	typ: string;
	label: string;
	icon: IconKomponente;
	href(id: string): string;
	alle(): { id: string; titel: string }[];
}

/** Aus dem Timeline-Feature (types.ts) hierher verschoben (Vertrag statt Feature-Typ). */
export interface TimelineEintrag {
	id: string;
	modul: ModulId;
	zeit: string;
	titel: string;
	untertitel?: string;
	href?: string;
	/** 'automation:<regelId>' → Herkunfts-Sticker AUTO */
	herkunft?: string;
}

export interface HilfeThema {
	/** '<modul>.<thema>' oder 'system.<thema>' */
	id: string;
	titel: string;
	/** 1 Satz für InfoTip */
	kurz: string;
	/** text: einfaches Markdown (renderMarkdownSafe) */
	abschnitte: { titel?: string; text: string }[];
	begriffe?: { wort: string; erklaerung: string }[];
	verwandt?: string[];
}

export interface ModulManifest {
	id: ModulId;
	store?: StoreLebenszyklus;
	suche?(anfrage: string): SuchTreffer[];
	erfassen?: ErfassenArt[];
	widgets?: WidgetDef[];
	agenda?(tag: Date): AgendaEintrag[];
	hinweise?(jetzt: Date): Hinweis[];
	/** Alle Hinweis-Arten des Moduls — Quelle für die Schalter in /settings#hinweise (T605). */
	hinweisArten?: { art: string; titel: string; bedingung: string; standardAktiv: boolean }[];
	score?: ScoreBeitrag;
	tageskontext?(datum: string): Record<string, unknown>;
	/** globale IDs: '<modul>.<verb>' */
	aktionen?: Record<string, AktionDef>;
	verknuepfbar?: VerknuepfbarDef[];
	timeline?(von: Date, bis: Date): TimelineEintrag[];
	export?(): unknown;
	snapshot?: { holen(): unknown; setzen(daten: unknown): void };
	einstellungen?: EinstellungDef<unknown>[];
	hilfe?: HilfeThema[];
}

export function defineModul(m: ModulManifest): ModulManifest {
	return m;
}
