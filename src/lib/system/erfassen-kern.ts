import type { ModulId } from '#lib/config/modules.js';
import type { ErfassenArt, ErfassenVorschau, ModulManifest } from '#lib/core/modul.js';

/** Rein, ohne Store- und Icon-Importe, damit Vitest es in Node testen kann. Gebunden an die aktiven Module wird in erfassen.ts. */

export interface Deutung {
	art: ErfassenArt;
	modul: ModulId;
	vorschau: ErfassenVorschau;
}

/** Unter dieser Sicherheit fragt Erfassen nach, statt still zu raten. */
export const SICHERHEIT_MIN = 0.5;

type ModulMitArten = Pick<ModulManifest, 'id' | 'erfassen'>;

const rangVon = (d: Deutung) => d.vorschau.rang ?? d.art.rang;

/**
 * Alle Deutungen des Textes, bester zuerst (kleinster Rang, danach höhere Sicherheit).
 * Die Aufgabe ist der Rückfall und deshalb fast immer dabei. Durch die Prüfreihenfolge
 * bleibt das Ergebnis gleich zur früheren Einzel-Auswertung (`parseNLPInput`).
 */
export function deuteIn(module: ModulMitArten[], text: string, jetzt = new Date()): Deutung[] {
	const t = text.trim();
	if (!t) return [];
	const treffer: Deutung[] = [];
	for (const m of module) {
		for (const art of m.erfassen ?? []) {
			try {
				const vorschau = art.erkennen(t, jetzt);
				if (vorschau) treffer.push({ art, modul: m.id, vorschau });
			} catch (err) {
				// Eine kaputte Erkennung darf die übrigen nicht verdecken.
				console.error(`[erfassen] ${art.id} fehlgeschlagen`, err);
			}
		}
	}
	return treffer.sort(
		(a, b) => rangVon(a) - rangVon(b) || b.vorschau.sicherheit - a.vorschau.sicherheit
	);
}

/** „Stattdessen als:“ — die anderen erkannten Arten plus alle aktiven, die den Text erzwingen können. */
export function alternativenIn(
	module: ModulMitArten[],
	text: string,
	deutungen: Deutung[]
): Deutung[] {
	const t = text.trim();
	if (!t) return [];
	const erkannt = new Set(deutungen.map((d) => d.art.id));
	const erzwungen: Deutung[] = [];
	for (const m of module) {
		for (const art of m.erfassen ?? []) {
			if (erkannt.has(art.id) || !art.erzwinge) continue;
			erzwungen.push({ art, modul: m.id, vorschau: art.erzwinge(t) });
		}
	}
	return [...deutungen.slice(1), ...erzwungen].sort((a, b) => rangVon(a) - rangVon(b));
}

/** Beispiele aller übergebenen Module für „So kannst du schreiben“. */
export function beispieleIn(module: ModulMitArten[]) {
	return module.flatMap((m) =>
		(m.erfassen ?? []).map((a) => ({ id: a.id, label: a.label, beispiele: a.beispiele }))
	);
}
