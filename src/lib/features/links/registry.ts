// Auflösung von Objekten für Universal-Links.
// Liest nur das Register aus core/verknuepfbar (befüllt von system/start.ts aus den Manifesten) —
// keine Feature-Stores.
import { Link2 } from '@lucide/svelte';
import { verknuepfbar } from '#lib/core/verknuepfbar.js';
import type { IconKomponente } from '#lib/ui/icon.js';
import type { LinkEntityType, LinkableEntity } from './types';

interface EntityMeta {
	label: string;
	icon: IconKomponente;
	route: (id: string) => string;
}

export function entityMeta(type: LinkEntityType): EntityMeta {
	const def = verknuepfbar.hole(type);
	if (!def) return { label: 'Objekt', icon: Link2, route: () => '/' };
	return { label: def.label, icon: def.icon, route: def.href };
}

function allEntities(): LinkableEntity[] {
	return verknuepfbar
		.alle()
		.flatMap((def) =>
			def.alle().map((e) => ({ type: def.typ as LinkEntityType, id: e.id, title: e.titel }))
		);
}

export function resolveEntity(type: LinkEntityType, id: string): LinkableEntity | null {
	return allEntities().find((e) => e.type === type && e.id === id) ?? null;
}

export function searchEntities(
	query: string,
	exclude?: { type: LinkEntityType; id: string }
): LinkableEntity[] {
	const q = query.trim().toLowerCase();
	return allEntities()
		.filter((e) => !(exclude && e.type === exclude.type && e.id === exclude.id))
		.filter((e) => !q || e.title.toLowerCase().includes(q))
		.slice(0, 8);
}
