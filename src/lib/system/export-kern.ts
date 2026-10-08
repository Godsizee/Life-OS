import type { ModulManifest } from '#lib/core/modul.js';

export interface ExportQuellen {
	profil: { display_name: string | null; settings: unknown };
	/** Daten der Dienste ohne eigenes Modul (Verknüpfungen, Erinnerungen, Anhänge). */
	dienste: Record<string, unknown>;
	module: Pick<ModulManifest, 'id' | 'export'>[];
	jetzt: Date;
}

/**
 * Baut das Export-Dokument (Version 2). Das Gerüst entspricht dem früheren Export, dazu
 * `version` und die Liste der Module. Rein.
 *
 * Es zählen ALLE Module, nicht nur die eingeschalteten: „Deine Daten bleiben erhalten“ gilt auch
 * für ausgeschaltete Module.
 */
export function baueExport(q: ExportQuellen): Record<string, unknown> {
	const workspace: Record<string, unknown> = {};
	for (const m of q.module) {
		if (!m.export) continue;
		try {
			Object.assign(workspace, m.export() as Record<string, unknown>);
		} catch (err) {
			console.error(`[export] ${m.id} fehlgeschlagen`, err);
		}
	}
	Object.assign(workspace, q.dienste);
	return {
		version: 2,
		export_date: q.jetzt.toISOString(),
		module: q.module.map((m) => m.id),
		profile: q.profil,
		workspace
	};
}
