// W9 — Icons je Aktivitaets-Gruppe. Getrennt von activities.ts, weil @lucide/svelte
// in der Node-Testumgebung nicht geladen werden darf (Muster: shopping/category-icons.ts).
import { Users, HeartPulse, Briefcase, Coffee, Brain, Tag } from '@lucide/svelte';
import type { IconKomponente } from '#lib/ui/icon.js';

const GROUP_ICONS: Record<string, IconKomponente> = {
	social: Users,
	body: HeartPulse,
	work: Briefcase,
	leisure: Coffee,
	state: Brain
};

/** Fallback fuer eigene Tags: neutrales Tag-Icon. */
export function groupIcon(groupId: string | null): IconKomponente {
	return (groupId && GROUP_ICONS[groupId]) || Tag;
}

export function activityIcon(activityGroup: string | null): IconKomponente {
	return groupIcon(activityGroup);
}
