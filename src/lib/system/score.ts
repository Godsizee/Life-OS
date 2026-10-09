import type { ModulId } from '#lib/config/modules.js';
import { wert } from '#lib/core/einstellungen.js';
import { verrechne, type ScoreEingabe, type ScoreErgebnis } from '#lib/core/score.js';
import { scoreFehlend, scoreGewichtDef } from './einstellungen/score.js';
import { aktiveModule } from './module-aktiv.svelte.js';
import { MODULE } from './module.js';

// Gewichts-Schalter für jedes Modul mit Score-Beitrag.
const gewichtDefs = new Map(
	MODULE.filter((m) => m.score).map((m) => [m.id, scoreGewichtDef(m.id, m.score!.label)])
);

/** Gewichts-Einstellungen der eingeschalteten Module mit Score-Beitrag (für die Oberfläche). */
export const gewichtDefsAktiv = () =>
	aktiveModule.liste.flatMap((m) => {
		const def = gewichtDefs.get(m.id);
		return def ? [def] : [];
	});

export const gewichtVon = (id: ModulId): number => {
	const def = gewichtDefs.get(id);
	return def ? wert(def) : 0;
};

/**
 * Life Score für einen Tag aus den Beiträgen der EINGESCHALTETEN Module, nach den Gewichten
 * und der Einstellung `score.fehlend`. Ein ausgeschaltetes Modul fehlt, die übrigen werden neu normiert.
 */
export function berechneModulScore(datum: string): ScoreErgebnis {
	const eingaben: ScoreEingabe[] = [];
	for (const m of aktiveModule.liste) {
		if (!m.score) continue;
		let w: number | null = null;
		let erklaerung: string;
		try {
			w = m.score.berechne(datum);
			erklaerung = m.score.erklaerung(datum);
		} catch (err) {
			// Ein kaputtes Modul darf den Score nicht verfälschen: es zählt dann nicht.
			console.error(`[score] ${m.id} fehlgeschlagen`, err);
			erklaerung = 'Berechnung fehlgeschlagen.';
		}
		eingaben.push({
			modul: m.id,
			label: m.score.label,
			wert: w,
			gewicht: gewichtVon(m.id),
			erklaerung
		});
	}
	return verrechne(eingaben, wert(scoreFehlend) === 'null');
}
