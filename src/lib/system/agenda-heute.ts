import { standardDauerMin, tagesbeginn, tagesende } from '#lib/config/heute.js';
import { wert } from '#lib/core/einstellungen.js';
import { expandEvents } from '#lib/features/calendar/occurrences.js';
import { calendarState } from '#lib/features/calendar/store.svelte.js';
import { fitnessState } from '#lib/features/fitness/store.svelte.js';
import { linksState } from '#lib/features/links/store.svelte.js';
import { baueTagesplan, type Tagesfenster, type Tagesplan } from './agenda.js';
import { mitGeplantemPlan, sammleAgendaIn, tagesfenster } from './agenda-kern.js';
import { aktiveModule, istAktiv } from './module-aktiv.svelte.js';

/** Trainingsplan, der mit einem heutigen Termin verknüpft ist (Kalender → Link `workout_plan`). */
function geplanterPlan(tag: Date): { id: string; name: string } | null {
	if (!istAktiv('fitness') || !istAktiv('calendar')) return null;
	const von = new Date(tag.getFullYear(), tag.getMonth(), tag.getDate());
	const bis = new Date(tag.getFullYear(), tag.getMonth(), tag.getDate(), 23, 59, 59, 999);
	for (const o of expandEvents(calendarState.events, calendarState.overrides, von, bis)) {
		const planId = linksState
			.linksFor('event', o.event.id)
			.map((l) =>
				l.source_type === 'workout_plan'
					? l.source_id
					: l.target_type === 'workout_plan'
						? l.target_id
						: null
			)
			.find((id): id is string => id !== null);
		const plan = planId ? fitnessState.plans.find((p) => p.id === planId) : undefined;
		if (plan) return { id: plan.id, name: plan.name };
	}
	return null;
}

/**
 * Tagesplan für „Heute“: Beiträge der aktiven Module, Tagesfenster und Standarddauer aus den Einstellungen.
 * `fenster` überschreibt das Fenster für diesen Aufruf (Schritt „Kapazität“ in „Tag planen“).
 */
export function heuteTagesplan(tag: Date = new Date(), fenster?: Tagesfenster): Tagesplan {
	const eintraege = mitGeplantemPlan(sammleAgendaIn(aktiveModule.liste, tag), geplanterPlan(tag));
	return baueTagesplan(
		eintraege,
		fenster ?? tagesfenster(tag, wert(tagesbeginn), wert(tagesende)),
		wert(standardDauerMin)
	);
}
