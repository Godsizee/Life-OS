import { modules } from '#lib/config/modules.js';
import { modulSchluessel } from './einstellungen/module.js';

/**
 * Patch für Bestandskonten (T203): Alle Module bleiben an, die der Nutzer schon hatte — auch die mit
 * `standardAktiv: false` (Training, Gesundheit, Einblicke). Bereits gesetzte Werte bleiben unangetastet.
 * `null` = nichts zu tun (Einrichtung lief schon, oder das Konto ist neu).
 */
export function bestandsPatch(
	einstellungen: Record<string, unknown>,
	hatDaten: boolean,
	heute: string
): Record<string, unknown> | null {
	const erledigt = einstellungen['setup.abgeschlossen'];
	if (typeof erledigt === 'string' && erledigt !== '') return null;
	if (!hatDaten) return null;
	const patch: Record<string, unknown> = {};
	for (const m of modules) {
		if (m.pflicht) continue;
		const k = modulSchluessel(m.id);
		if (einstellungen[k] === undefined) patch[k] = true;
	}
	patch['setup.abgeschlossen'] = `bestand-${heute}`;
	return patch;
}
