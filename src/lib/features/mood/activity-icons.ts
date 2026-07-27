// W9 — Icons je Aktivitaets-Gruppe. Getrennt von activities.ts, weil lucide-svelte
// in der Node-Testumgebung nicht geladen werden darf (Muster: shopping/category-icons.ts).
import { Users, HeartPulse, Briefcase, Coffee, Brain, Tag, type Icon } from 'lucide-svelte';

const GROUP_ICONS: Record<string, typeof Icon> = {
	social: Users,
	body: HeartPulse,
	work: Briefcase,
	leisure: Coffee,
	state: Brain
};

/** Fallback fuer eigene Tags: neutrales Tag-Icon. */
export function groupIcon(groupId: string | null): typeof Icon {
	return (groupId && GROUP_ICONS[groupId]) || Tag;
}

export function activityIcon(activityGroup: string | null): typeof Icon {
	return groupIcon(activityGroup);
}
