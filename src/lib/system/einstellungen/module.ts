import { z } from 'zod';
import { modules, type ModulId } from '#lib/config/modules.js';
import { defineEinstellung } from '#lib/core/einstellungen.js';

/** Schlüssel in `profiles.settings` — flach, nie verschachtelt (Falle F10). */
export const modulSchluessel = (id: ModulId) => `modul.${id}.aktiv`;

/** Je Modul ein Schalter. Pflichtmodule haben ebenfalls eine Definition, ihr Wert wird aber ignoriert. */
export const MODUL_AKTIV = Object.fromEntries(
	modules.map((m) => [
		m.id,
		defineEinstellung<boolean>({
			schluessel: modulSchluessel(m.id),
			ablage: 'nutzer',
			schema: z.boolean(),
			standard: m.standardAktiv,
			label: m.label,
			hinweis: m.kurz,
			stufe: 'schnell',
			abschnitt: 'module',
			ui: { art: 'schalter' }
		})
	])
) as Record<ModulId, ReturnType<typeof defineEinstellung<boolean>>>;
