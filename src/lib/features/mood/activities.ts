// W9 Stimmung — Aktivitaeten-Katalog + reine Tag-Logik (Daylio-Muster).
// KEIN lucide-Import hier (Node-Test-Umgebung) — Icons stehen in activity-icons.ts.
// Muster: shopping/categories.ts (W2).

export interface ActivityGroup {
	id: string;
	label: string;
}

export const ACTIVITY_GROUPS: ActivityGroup[] = [
	{ id: 'social', label: 'Soziales' },
	{ id: 'body', label: 'Körper' },
	{ id: 'work', label: 'Arbeit & Alltag' },
	{ id: 'leisure', label: 'Freizeit' },
	{ id: 'state', label: 'Zustand' }
];

export interface ActivityDef {
	id: string;
	label: string;
	group: string;
}

/** Fester Katalog. Erweiterung = eigener Tag (Freitext), keine Migration. */
export const ACTIVITY_CATALOG: ActivityDef[] = [
	{ id: 'partner', label: 'Partner', group: 'social' },
	{ id: 'familie', label: 'Familie', group: 'social' },
	{ id: 'freunde', label: 'Freunde', group: 'social' },
	{ id: 'allein', label: 'Zeit allein', group: 'social' },

	{ id: 'sport', label: 'Sport', group: 'body' },
	{ id: 'spaziergang', label: 'Spaziergang', group: 'body' },
	{ id: 'gut_geschlafen', label: 'Gut geschlafen', group: 'body' },
	{ id: 'schlecht_geschlafen', label: 'Schlecht geschlafen', group: 'body' },
	{ id: 'krank', label: 'Krank', group: 'body' },
	{ id: 'gesund_gegessen', label: 'Gesund gegessen', group: 'body' },

	{ id: 'arbeit', label: 'Arbeit', group: 'work' },
	{ id: 'gelernt', label: 'Gelernt', group: 'work' },
	{ id: 'haushalt', label: 'Haushalt', group: 'work' },
	{ id: 'erledigungen', label: 'Erledigungen', group: 'work' },

	{ id: 'gelesen', label: 'Gelesen', group: 'leisure' },
	{ id: 'gezockt', label: 'Gezockt', group: 'leisure' },
	{ id: 'film', label: 'Film & Serie', group: 'leisure' },
	{ id: 'musik', label: 'Musik', group: 'leisure' },
	{ id: 'gekocht', label: 'Gekocht', group: 'leisure' },
	{ id: 'draussen', label: 'Draußen', group: 'leisure' },
	{ id: 'unterwegs', label: 'Unterwegs', group: 'leisure' },

	{ id: 'stress', label: 'Stress', group: 'state' },
	{ id: 'entspannt', label: 'Entspannt', group: 'state' },
	{ id: 'produktiv', label: 'Produktiv', group: 'state' },
	{ id: 'einsam', label: 'Einsam', group: 'state' },
	{ id: 'unruhig', label: 'Unruhig', group: 'state' }
];

const BY_ID = new Map(ACTIVITY_CATALOG.map((a) => [a.id, a]));

export function isCatalogActivity(id: string): boolean {
	return BY_ID.has(id);
}

/**
 * Freitext -> Tag-ID. Trim, klein, Leerzeichen/Punkte -> '_', fuehrendes '#' weg,
 * alles ausser [a-z0-9äöüß_-] entfernt, auf 24 Zeichen gekuerzt.
 * Leeres Ergebnis -> '' (Aufrufer verwirft es).
 */
export function normalizeActivity(raw: string): string {
	return raw
		.trim()
		.toLowerCase()
		.replace(/^#+/, '')
		.replace(/[\s.]+/g, '_')
		.replace(/[^a-z0-9äöüß_-]/g, '')
		.replace(/_{2,}/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 24);
}

/** Anzeigename: Katalog-Label oder aufgehuebschter eigener Tag. */
export function activityLabel(id: string): string {
	const known = BY_ID.get(id);
	if (known) return known.label;
	const words = id.replace(/[_-]+/g, ' ').trim();
	return words ? words.charAt(0).toUpperCase() + words.slice(1) : id;
}

export function groupLabel(groupId: string): string {
	return ACTIVITY_GROUPS.find((g) => g.id === groupId)?.label ?? groupId;
}

export interface CatalogGroup {
	group: ActivityGroup;
	activities: ActivityDef[];
}

/** Katalog nach Gruppen, in Katalog-Reihenfolge. Leere Gruppen entfallen. */
export function groupedCatalog(): CatalogGroup[] {
	return ACTIVITY_GROUPS.map((group) => ({
		group,
		activities: ACTIVITY_CATALOG.filter((a) => a.group === group.id)
	})).filter((g) => g.activities.length > 0);
}

/** Tag an/aus. Gibt immer ein neues Array zurueck (Runes-freundlich). */
export function toggleActivity(list: string[], id: string): string[] {
	return list.includes(id) ? list.filter((a) => a !== id) : [...list, id];
}

/** Dubletten raus, leere raus, Reihenfolge bleibt. */
export function cleanActivities(list: readonly string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const raw of list) {
		const id = normalizeActivity(String(raw ?? ''));
		if (!id || seen.has(id)) continue;
		seen.add(id);
		out.push(id);
	}
	return out;
}

/**
 * Eigene (nicht im Katalog stehende) Tags aus der Historie, haeufigste zuerst.
 * Das ist die „workspace-erweiterbare" Haelfte des Katalogs — ohne Tabelle.
 */
export function customActivities(
	entries: { activities?: string[] | null }[],
	limit = 20
): string[] {
	const counts = new Map<string, number>();
	for (const e of entries) {
		const list = Array.isArray(e.activities) ? e.activities : [];
		for (const id of new Set(list)) {
			if (!id || isCatalogActivity(id)) continue;
			counts.set(id, (counts.get(id) ?? 0) + 1);
		}
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.slice(0, limit)
		.map(([id]) => id);
}

/** Alle eigenen (nicht im Katalog stehenden) Tags mit Häufigkeit. */
export function customActivitiesWithCounts(
	entries: { activities?: string[] | null }[]
): { tag: string; count: number }[] {
	const zaehler = new Map<string, number>();
	for (const e of entries) {
		for (const a of e.activities ?? []) {
			if (a && !isCatalogActivity(a)) zaehler.set(a, (zaehler.get(a) ?? 0) + 1);
		}
	}
	return [...zaehler.entries()]
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'de'));
}

/** Tag in einer Aktivitätsliste umbenennen oder (bei null) entfernen. Dublettenfrei. */
export function renameInList(list: string[], von: string, nach: string | null): string[] {
	const ohne = list.filter((a) => a !== von);
	if (nach === null || ohne.includes(nach)) return ohne;
	return list.includes(von) ? [...ohne, nach] : list;
}
