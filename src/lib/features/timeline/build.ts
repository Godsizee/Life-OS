import type { TimelineFenster, TimelineGroup, TimelineItem, TimelineQuellen } from './types';
import { toISODate, fromISODate } from '$lib/core/date';
import { isCompleted, type HabitDay } from '$lib/features/habits/streak';
import { activityLabel } from '$lib/features/mood/activities';
import { expandEvents } from '$lib/features/calendar/occurrences';
import { entryDate, formatMinutes, minutesOf, pomodorosOnDate } from '$lib/features/timetracking/stats';

/** Baut die Einträge im Fenster, absteigend nach Datum. Keine Store-Zugriffe. */
export function buildTimeline(q: TimelineQuellen, f: TimelineFenster): TimelineItem[] {
	const items: TimelineItem[] = [];
	const vonStr = f.von;
	const bisStr = f.bis;

	const isInFenster = (dateStr: string) => dateStr >= vonStr && dateStr <= bisStr;

	// 1. Completed Tasks
	q.tasks.forEach((t) => {
		if (t.status === 'done' && (t.completed_at || t.updated_at)) {
			const date = toISODate(new Date(t.completed_at ?? t.updated_at));
			if (isInFenster(date)) {
				items.push({
					id: `task_${t.id}`,
					date,
					title: `Aufgabe abgeschlossen: "${t.title}"`,
					module: 'tasks'
				});
			}
		}
	});

	// 2. Logged Habits
	q.habitLogs.forEach((log) => {
		if (isInFenster(log.date)) {
			const habit = q.habits.find((h) => h.id === log.habit_id);
			if (habit && isCompleted(habit, log as unknown as HabitDay)) {
				items.push({
					id: `habit_${log.id}`,
					date: log.date,
					title: `Routine erledigt: "${habit.name}"`,
					module: 'habits'
				});
			}
		}
	});

	// 3. Mood Entries
	q.moods.forEach((m) => {
		if (isInFenster(m.date)) {
			const tags = (m.activities ?? []).map((a) => activityLabel(a as any));
			const desc = [m.note, tags.length > 0 ? tags.join(' · ') : null]
				.filter(Boolean)
				.join(' — ');
			items.push({
				id: `mood_${m.id}`,
				date: m.date,
				title: `Stimmung eingetragen: ${m.score}/5`,
				description: desc || undefined,
				module: 'mood'
			});
		}
	});

	// 4. Goals Completed
	q.goals.forEach((g) => {
		if (g.status === 'done' && g.updated_at) {
			const date = toISODate(new Date(g.updated_at));
			if (isInFenster(date)) {
				items.push({
					id: `goal_${g.id}`,
					date,
					title: `🎯 Ziel erreicht! "${g.title}"`,
					description: g.description ?? undefined,
					module: 'goals'
				});
			}
		}
	});

	// 5. Goal Checkins
	q.checkins.forEach((c) => {
		const date = toISODate(new Date(c.created_at));
		if (isInFenster(date)) {
			const goal = q.goals.find((g) => g.id === c.goal_id);
			items.push({
				id: `checkin_${c.id}`,
				date,
				title: `Check-in: ${goal?.title ?? 'Ziel'}`,
				description: `${c.value} ${goal?.target_unit ?? ''}`.trim(),
				module: 'checkins'
			});
		}
	});

	// 6. Journal Entries
	q.journal.forEach((j) => {
		const date = j.date;
		if (isInFenster(date)) {
			const kindLabel = j.kind === 'daily' ? 'Tagebuch-Eintrag' : 'Wochenrückblick';
			items.push({
				id: `journal_${j.id}`,
				date,
				title: kindLabel,
				description: j.context?.mood ? `Stimmung: ${j.context.mood}/5` : undefined,
				module: 'journal'
			});
		}
	});

	// 7. Health Logs
	q.health.forEach((h) => {
		if (isInFenster(h.date)) {
			const details: string[] = [];
			if (h.weight_kg) details.push(`${h.weight_kg} kg`);
			if (h.sleep_h) details.push(`${h.sleep_h} Std. Schlaf`);
			// water is usually calculated via stats, we keep it simple here or don't show it if we don't have profileState
			// or we just show what we have
			if (details.length > 0) {
				items.push({
					id: `health_${h.id}`,
					date: h.date,
					title: 'Gesundheitswerte erfasst',
					description: details.join(' · '),
					module: 'health'
				});
			}
		}
	});

	// 8. Fitness Logs
	q.workouts.forEach((log) => {
		if (isInFenster(log.date)) {
			const planName = q.plans.find((p) => p.id === log.plan_id)?.name ?? 'Freies Training';
			items.push({
				id: `fitness_${log.id}`,
				date: log.date,
				title: `Workout absolviert: "${planName}"`,
				description: log.duration_minutes ? `${log.duration_minutes} Min.` : undefined,
				module: 'fitness'
			});
		}
	});

	// 9. Notes
	q.notes.forEach((n) => {
		const date = toISODate(new Date(n.created_at));
		if (isInFenster(date)) {
			items.push({
				id: `note_${n.id}`,
				date,
				title: `Notiz angelegt: "${n.title}"`,
				description: n.private ? 'Privat' : undefined,
				module: 'notes'
			});
		}
	});

	// 10. Events
	const dVon = fromISODate(f.von) ?? new Date(0);
	const dBis = fromISODate(f.bis) ?? new Date();
	const pastEvents = expandEvents(q.events, q.overrides, dVon, dBis);
	pastEvents.forEach((o) => {
		if (isInFenster(o.occurrenceDate)) {
			items.push({
				id: `event_${o.key}`,
				date: o.occurrenceDate,
				title: `Termin: "${o.title}"`,
				module: 'calendar'
			});
		}
	});

	// 11. Focus Time
	const focusPerDay = new Map<string, number>();
	q.timeEntries.forEach((e) => {
		const d = entryDate(e);
		if (isInFenster(d)) {
			focusPerDay.set(d, (focusPerDay.get(d) ?? 0) + minutesOf(e));
		}
	});
	focusPerDay.forEach((minutes, date) => {
		if (minutes <= 0) return;
		const rounds = pomodorosOnDate(q.timeEntries, date);
		items.push({
			id: `focus_${date}`,
			date,
			title: `${formatMinutes(minutes)} fokussiert`,
			description: rounds > 0 ? `${rounds} Runde${rounds !== 1 ? 'n' : ''}` : undefined,
			module: 'focus'
		});
	});

	return items.sort((a, b) => b.date.localeCompare(a.date));
}

/** Gruppiert nach Tag. Erwartet bereits gefilterte Einträge. */
export function groupByDay(items: TimelineItem[]): TimelineGroup[] {
	const groups: Record<string, TimelineItem[]> = {};
	
	items.forEach((item) => {
		if (!groups[item.date]) groups[item.date] = [];
		groups[item.date].push(item);
	});

	return Object.entries(groups)
		.map(([date, groupItems]) => ({ date, items: groupItems }))
		.sort((a, b) => b.date.localeCompare(a.date));
}
