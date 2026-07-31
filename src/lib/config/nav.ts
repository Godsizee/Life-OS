import { modules, bottomNavModuleIds, type ModuleConfig } from './modules';

/** Gespeicherte Auswahl (nur bekannte IDs, max. 4) + Auffüllen aus der Standardliste. */
export function resolveNavModules(ids: string[] | undefined): ModuleConfig[] {
	const gueltig = (ids ?? []).filter((id) => modules.some((m) => m.id === id)).slice(0, 4);
	const fehlend = bottomNavModuleIds.filter((id) => !gueltig.includes(id));
	return [...gueltig, ...fehlend].slice(0, 4)
		.map((id) => modules.find((m) => m.id === id))
		.filter((m): m is ModuleConfig => m !== undefined);
}
