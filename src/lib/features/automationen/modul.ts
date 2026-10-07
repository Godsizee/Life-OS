import type { StoreLebenszyklus } from '#lib/core/modul.js';
import { automationen } from './laufzeit.svelte.js';

/**
 * Dienst ohne Nav-Eintrag (system/dienste.ts): Es wird nichts vom Server geladen — Regeln stehen im Code,
 * Überschreibungen in den Profil-Einstellungen. Der Dienst räumt beim Abmelden Protokoll und Vorschläge ab.
 */
export const automationenDienst: StoreLebenszyklus = {
	laden: async () => {},
	neuLaden: async () => {},
	entladen: () => automationen.leeren()
};
