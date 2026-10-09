import type { ZodMiniType } from 'zod/mini';

export type Ablage = 'nutzer' | 'haushalt' | 'geraet';
export type Stufe = 'schnell' | 'modul' | 'erweitert';

export type EinstellungUi =
	| { art: 'schalter' }
	| { art: 'auswahl'; optionen: { wert: string; label: string }[] }
	| { art: 'zahl'; min: number; max: number; schritt: number; einheit?: string }
	| { art: 'zeit' } // "HH:MM"
	| { art: 'text'; maxLaenge: number }
	| { art: 'eigen' }; // eigene Komponente im Modul

export interface EinstellungDef<T> {
	/** Bestand bleibt (z. B. 'water_unit'); NEU immer '<modul>.<name>' — flach, nie verschachtelt (Falle F10). */
	schluessel: string;
	ablage: Ablage;
	schema: ZodMiniType<T>;
	standard: T;
	label: string;
	/** EIN Satz: was bewirkt das? (erscheint unter dem Regler) */
	hinweis?: string;
	stufe: Stufe;
	/** Anker in /settings, z. B. 'darstellung', 'tasks' */
	abschnitt: string;
	ui: EinstellungUi;
}
export const defineEinstellung = <T>(d: EinstellungDef<T>) => d;

interface Speicher {
	/** reaktiv lesen ($state dahinter) */
	lesen(schluessel: string): unknown;
	schreiben(patch: Record<string, unknown>): Promise<void>;
}
const speicher: Partial<Record<Ablage, Speicher>> = {};
export function registriereSpeicher(ablage: Ablage, s: Speicher): void {
	speicher[ablage] = s;
}

/** Liest den Wert — ungültige/fehlende Werte fallen IMMER auf den Standard zurück (nie Absturz). */
export function wert<T>(def: EinstellungDef<T>): T {
	const roh = speicher[def.ablage]?.lesen(def.schluessel);
	if (roh === undefined || roh === null) return def.standard;
	const r = def.schema.safeParse(roh);
	return r.success ? r.data : def.standard;
}

export async function setze<T>(def: EinstellungDef<T>, neu: T): Promise<void> {
	const geprueft = def.schema.parse(neu);
	const s = speicher[def.ablage];
	if (!s) throw new Error(`Kein Speicher für Ablage '${def.ablage}' registriert`);
	await s.schreiben({ [def.schluessel]: geprueft });
}

export async function zuruecksetzen(defs: EinstellungDef<unknown>[]): Promise<void> {
	for (const d of defs) await setze(d, d.standard);
}
