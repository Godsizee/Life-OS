import { modules, type ModulId } from '#lib/config/modules.js';
import { setze, wert } from '#lib/core/einstellungen.js';
import { MODUL_AKTIV } from './einstellungen/module.js';
import { MODULE } from './module.js';

/** Pflichtmodule sind immer aktiv. Liest reaktiv aus den Nutzer-Einstellungen. */
export function istAktiv(id: ModulId): boolean {
	const meta = modules.find((m) => m.id === id);
	if (!meta) return false;
	return meta.pflicht ? true : wert(MODUL_AKTIV[id]);
}

export function setzeAktiv(id: ModulId, aktiv: boolean): Promise<void> {
	return setze(MODUL_AKTIV[id], aktiv);
}

/** Aktive Module (Metadaten) bzw. Manifeste in Registry-Reihenfolge. */
export const aktiveModule = {
	get meta() {
		return modules.filter((m) => istAktiv(m.id));
	},
	get liste() {
		return MODULE.filter((m) => istAktiv(m.id));
	},
	get ausgeschaltet() {
		return modules.filter((m) => !istAktiv(m.id));
	}
};

/** Modul hinter einer Erfassen-Art von `parseNLPInput` (bis T206 die Module selbst erkennen). */
const NLP_MODUL: Record<string, ModulId> = {
	task: 'tasks',
	shopping: 'shopping',
	event: 'calendar',
	health: 'health',
	habit: 'habits',
	note: 'notes',
	goal: 'goals',
	mood: 'mood'
};

export const nlpArtErlaubt = (art: string): boolean => {
	const id = NLP_MODUL[art];
	return id ? istAktiv(id) : true;
};
