import type { LifeEvent } from '#lib/core/ereignisse.js';
import type { ModulId } from '#lib/config/modules.js';
import type { GeplanteAktion, Regel, RegelModus, RegelUeberschreibung } from './types.js';

export function wirksam(r: Regel, ue: RegelUeberschreibung | undefined) {
	return {
		aktiv: ue?.aktiv ?? r.standard.aktiv,
		modus: ue?.modus ?? r.standard.modus,
		parameter: { ...r.standard.parameter, ...(ue?.parameter ?? {}) }
	};
}

export function planeFuerEreignis(
	e: LifeEvent,
	regeln: Regel[],
	ueberschreibungen: Record<string, RegelUeberschreibung | undefined>,
	modulAktiv: (id: ModulId) => boolean,
	alleAn: boolean
): { regel: Regel; modus: RegelModus; aktionen: GeplanteAktion[] }[] {
	if (!alleAn) return [];
	const out: { regel: Regel; modus: RegelModus; aktionen: GeplanteAktion[] }[] = [];
	for (const r of regeln) {
		if (r.ausloeser !== e.typ) continue;
		if (e.ursache.art === 'automation' && e.ursache.regelId === r.id) continue; // nie sich selbst
		const w = wirksam(r, ueberschreibungen[r.id]);
		if (!w.aktiv || !r.module.every(modulAktiv)) continue;
		const aktionen = r.plane(e as never, w.parameter);
		if (aktionen.length > 0) out.push({ regel: r, modus: w.modus, aktionen });
	}
	return out;
}
