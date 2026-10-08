import type { DayRitual } from './rituale-types';

export const INTENTION_MAX = 280;

type Patch = Partial<Pick<DayRitual, 'planned_at' | 'closed_at' | 'capacity_min' | 'intention'>>;

/**
 * Fügt einen Patch in den Eintrag des Tages ein oder legt ihn neu an.
 * Rein, damit Anlegen und Fortschreiben dieselbe Zeile (Schlüssel `user_id, date`) treffen.
 */
export function mitPatch(
	bestehend: DayRitual | undefined,
	neu: Pick<DayRitual, 'id' | 'workspace_id' | 'user_id' | 'date'>,
	patch: Patch,
	jetzt: string
): DayRitual {
	const p: Patch = { ...patch };
	if (p.intention !== undefined && p.intention !== null) {
		const t = p.intention.trim().slice(0, INTENTION_MAX);
		p.intention = t === '' ? null : t;
	}
	if (p.capacity_min !== undefined && p.capacity_min !== null) {
		p.capacity_min = Math.max(0, Math.min(1440, Math.round(p.capacity_min)));
	}
	const basis: DayRitual = bestehend ?? {
		...neu,
		planned_at: null,
		closed_at: null,
		capacity_min: null,
		intention: null,
		created_at: jetzt,
		updated_at: jetzt
	};
	return { ...basis, ...p, updated_at: jetzt };
}

/** Ersetzt den Eintrag mit gleichem Datum bzw. fügt ihn hinzu (Realtime kann zwei Geräte-IDs liefern). */
export function ersetzeNachDatum(liste: DayRitual[], row: DayRitual): DayRitual[] {
	const rest = liste.filter((r) => r.id !== row.id && r.date !== row.date);
	return [...rest, row].sort((a, b) => b.date.localeCompare(a.date));
}
