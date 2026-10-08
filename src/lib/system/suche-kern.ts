import type { ModulId, ModulMeta } from '#lib/config/modules.js';
import type { ModulManifest, SuchTreffer } from '#lib/core/modul.js';
import { passung } from '#lib/core/text.js';

/** Rein, ohne Store- und Icon-Importe (testbar in Node). Gebunden an die aktiven Module wird in suche.ts. */

export type ErgebnisArt = 'ausfuehren' | 'treffer' | 'modul' | 'befehl';

export interface Ergebnis {
	/** stabil, auch für `aria-activedescendant` */
	id: string;
	art: ErgebnisArt;
	/** Überschrift der Gruppe: „Erfassen“, „Module“, „Aufgaben“ … */
	gruppe: string;
	label: string;
	sub?: string;
	modul?: ModulId;
	href?: string;
	/** Nur für `ausfuehren`: legt den erkannten Eintrag an und liefert die Meldung. */
	aktion?: () => Promise<string>;
}

export type SuchModus = 'normal' | 'hilfe' | 'befehle';

/** `?` = Hilfethemen (ab T501), `>` = Befehle. */
export function moduswahl(roh: string): { modus: SuchModus; anfrage: string } {
	const t = roh.trimStart();
	if (t.startsWith('?')) return { modus: 'hilfe', anfrage: t.slice(1).trim() };
	if (t.startsWith('>')) return { modus: 'befehle', anfrage: t.slice(1).trim() };
	return { modus: 'normal', anfrage: roh.trim() };
}

/** Treffer der Module, je Modul gruppiert, in Registry-Reihenfolge. */
export function trefferJeModul(
	module: Pick<ModulManifest, 'id' | 'suche'>[],
	anfrage: string,
	labelVon: (id: ModulId) => string
): Ergebnis[] {
	const out: Ergebnis[] = [];
	for (const m of module) {
		if (!m.suche) continue;
		let treffer: SuchTreffer[];
		try {
			treffer = m.suche(anfrage);
		} catch (err) {
			// Eine kaputte Suche darf die übrigen nicht verdecken.
			console.error(`[suche] ${m.id} fehlgeschlagen`, err);
			continue;
		}
		for (const t of treffer) {
			out.push({
				id: `treffer-${t.modul}-${t.id}`,
				art: 'treffer',
				gruppe: labelVon(m.id),
				label: t.titel,
				sub: t.untertitel,
				modul: t.modul,
				href: t.href
			});
		}
	}
	return out;
}

/** „Gehe zu“-Einträge der aktiven Module; mit Anfrage nur die passenden. */
export function modulEintraege(module: ModulMeta[], anfrage: string): Ergebnis[] {
	return module
		.filter((m) => !anfrage || passung(m.label, anfrage) > 0)
		.map((m) => ({
			id: `modul-${m.id}`,
			art: 'modul' as const,
			gruppe: 'Module',
			label: m.label,
			sub: m.kurz,
			modul: m.id,
			href: m.route
		}));
}

interface Befehl {
	id: string;
	label: string;
	href: string;
	modul?: ModulId;
}

/** Befehle: jedes aktive Modul öffnen, dazu feste Ziele. „Tag planen“ und „Tag abschließen“ folgen mit T404/T405. */
export function befehle(module: ModulMeta[], anfrage: string): Ergebnis[] {
	const alle: Befehl[] = [
		...module.map((m) => ({
			id: `oeffne-${m.id}`,
			label: `${m.label} öffnen`,
			href: m.route,
			modul: m.id
		})),
		...(module.some((m) => m.id === 'focus')
			? [{ id: 'fokus-starten', label: 'Fokus starten', href: '/focus', modul: 'focus' as const }]
			: []),
		{ id: 'einstellungen', label: 'Einstellungen', href: '/settings' },
		{ id: 'automationen', label: 'Automationen', href: '/settings/automationen' },
		{
			id: 'automationen-verlauf',
			label: 'Automationen-Verlauf',
			href: '/settings/automationen/verlauf'
		}
	];
	return alle
		.map((b) => ({ b, g: passung(b.label, anfrage) }))
		.filter((x) => x.g > 0)
		.sort((a, b) => b.g - a.g)
		.map(({ b }) => ({
			id: `befehl-${b.id}`,
			art: 'befehl' as const,
			gruppe: 'Befehle',
			label: b.label,
			modul: b.modul,
			href: b.href
		}));
}
