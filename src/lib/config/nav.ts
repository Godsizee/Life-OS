import { modules, bottomNavModuleIds, type ModulId, type ModulMeta } from './modules';

/**
 * Gespeicherte Auswahl (nur bekannte, aktive IDs, max. 4) + Auffüllen aus der Standardliste.
 * Ist ein Standard-Modul abgeschaltet, rückt das nächste aktive Modul nach — die Leiste
 * behält immer vier Plätze.
 */
export function resolveNavModules(
	ids: string[] | undefined,
	istAktiv: (id: ModulId) => boolean = () => true
): ModulMeta[] {
	const nutzbar = (id: string): id is ModulId =>
		modules.some((m) => m.id === id) && istAktiv(id as ModulId);
	const reihenfolge = [
		...(ids ?? []).filter(nutzbar).slice(0, 4),
		...bottomNavModuleIds.filter(nutzbar),
		...modules.map((m) => m.id).filter(nutzbar)
	];
	return [...new Set(reihenfolge)]
		.slice(0, 4)
		.map((id) => modules.find((m) => m.id === id))
		.filter((m): m is ModulMeta => m !== undefined);
}
