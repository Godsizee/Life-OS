import { modules } from '#lib/config/modules.js';
import { deute } from './erfassen.js';
import { sucheThemen } from './hilfe-kern.js';
import { geladeneThemen } from './hilfe-themen.svelte.js';
import { aktiveModule } from './module-aktiv.svelte.js';
import {
	befehle,
	hilfeEintraege,
	modulEintraege,
	moduswahl,
	trefferJeModul,
	type Ergebnis,
	type SuchModus
} from './suche-kern.js';

export type { Ergebnis, SuchModus } from './suche-kern.js';

const labelVon = (id: string) => modules.find((m) => m.id === id)?.label ?? id;

/**
 * Alles, was die Suche zeigt, in Anzeigereihenfolge:
 * Erfassen (erkannte Eingabe) → Module → Treffer je Modul. `>` zeigt nur Befehle,
 * `?` nur Hilfethemen.
 */
export function sammleErgebnisse(roh: string): { modus: SuchModus; ergebnisse: Ergebnis[] } {
	const { modus, anfrage } = moduswahl(roh);
	if (modus === 'hilfe') {
		const themen = geladeneThemen();
		return { modus, ergebnisse: themen ? hilfeEintraege(sucheThemen(themen, anfrage)) : [] };
	}
	if (modus === 'befehle') {
		return { modus, ergebnisse: befehle(aktiveModule.meta, anfrage) };
	}

	const ergebnisse: Ergebnis[] = [];
	if (anfrage) {
		const d = deute(anfrage)[0];
		if (d) {
			ergebnisse.push({
				id: 'ausfuehren',
				art: 'ausfuehren',
				gruppe: 'Erfassen',
				label: `Ausführen: „${anfrage}“`,
				sub: `Erkannt: ${d.vorschau.art}`,
				modul: d.modul,
				aktion: () => d.art.ausfuehren(d.vorschau)
			});
		}
	}
	ergebnisse.push(...modulEintraege(aktiveModule.meta, anfrage));
	if (anfrage) ergebnisse.push(...trefferJeModul(aktiveModule.liste, anfrage, labelVon));
	return { modus, ergebnisse };
}
