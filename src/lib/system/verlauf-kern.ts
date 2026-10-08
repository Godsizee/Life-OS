import type { ModulManifest, TimelineEintrag } from '#lib/core/modul.js';

/** Fügt die Verlaufsbeiträge der übergebenen Module zusammen, neueste zuerst. Rein. */
export function sammleVerlaufIn(
	module: Pick<ModulManifest, 'id' | 'timeline'>[],
	von: Date,
	bis: Date
): TimelineEintrag[] {
	const alle: TimelineEintrag[] = [];
	for (const m of module) {
		if (!m.timeline) continue;
		try {
			alle.push(...m.timeline(von, bis));
		} catch (err) {
			// Ein kaputter Beitrag darf den restlichen Verlauf nicht verdecken.
			console.error(`[verlauf] ${m.id} fehlgeschlagen`, err);
		}
	}
	return alle.sort((a, b) => b.zeit.localeCompare(a.zeit));
}
