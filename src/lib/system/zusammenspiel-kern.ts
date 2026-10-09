import type { ModulId } from '#lib/config/modules.js';

/** Rein (testbar). Die Texte liegen in `features/hilfe/inhalte/zusammenspiel.ts`. */

export interface ZusammenspielEintrag {
	mit: ModulId;
	wie: string;
}

export interface ZusammenspielAnsicht {
	/** Was dieses Modul von anderen bekommt (Eintrag: das liefernde Modul). */
	bekommtVon: ZusammenspielEintrag[];
	/** Was dieses Modul anderen liefert (Eintrag: das empfangende Modul). */
	liefertAn: ZusammenspielEintrag[];
}

/** Beziehungen eines Moduls, nur zu aktiven Modulen. */
export function zusammenspielFuer(
	modul: ModulId,
	aktiv: ModulId[],
	daten: Partial<Record<ModulId, ZusammenspielEintrag[]>>
): ZusammenspielAnsicht {
	const istAktiv = (id: ModulId) => aktiv.includes(id);
	const liefertAn = (daten[modul] ?? []).filter((e) => istAktiv(e.mit));
	const bekommtVon: ZusammenspielEintrag[] = [];
	for (const [von, eintraege] of Object.entries(daten) as [ModulId, ZusammenspielEintrag[]][]) {
		if (!istAktiv(von)) continue;
		for (const e of eintraege) if (e.mit === modul) bekommtVon.push({ mit: von, wie: e.wie });
	}
	return { bekommtVon, liefertAn };
}

/** Status einer Regel für die Anzeige: Hauptschalter, eigene Einstellung oder Standard. */
export function regelStatus(
	alleAktiv: boolean,
	eigene: boolean | undefined,
	standard: boolean
): 'aktiv' | 'aus' {
	return alleAktiv && (eigene ?? standard) ? 'aktiv' : 'aus';
}
