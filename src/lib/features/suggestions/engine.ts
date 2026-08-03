import { tasksState } from '$lib/features/tasks/store.svelte';
import { habitsState } from '$lib/features/habits/store.svelte';
import { healthState } from '$lib/features/health/store.svelte';
import { goalsState } from '$lib/features/goals/store.svelte';
import { fitnessState } from '$lib/features/fitness/store.svelte';
import { getGoalProgress } from '$lib/features/goals/progress';
import { evaluateTrack } from '$lib/features/goals/checkins';
import { calculateStreak, toISODate, isOpenToday, streakLabel } from '$lib/features/habits/streak';
import { shoppingState } from '$lib/features/shopping/store.svelte';
import { waterMl } from '$lib/features/health/stats';
import { profileState } from '$lib/features/profile/store.svelte';
import { analyticsState } from '$lib/features/analytics/store.svelte';

export interface Suggestion {
	id: string;
	title: string;
	description: string;
	icon: string;
	type: 'warning' | 'info' | 'success' | 'action';
	actionText?: string;
	actionRoute?: string;
	onClick?: () => void | Promise<void>;
}

export function getSuggestions(): Suggestion[] {
	const list: Suggestion[] = [];
	const todayStr = toISODate(new Date());

	// 1. Streak in Gefahr (Streak >= 3 + heute ungeloggt)
	for (const habit of habitsState.habits.filter((h) => !h.archived)) {
		const days = habitsState.entriesFor(habit.id);
		const streak = calculateStreak(habit, days);
		const openToday = isOpenToday(habit, days);
		if (streak > 0 && openToday) {
			list.push({
				id: `streak_${habit.id}`,
				title: '🔥 Streak in Gefahr!',
				description: `Logge "${habit.name}" heute, um deine Serie von ${streakLabel(habit.schedule, streak)} zu halten!`,
				icon: '🔥',
				type: 'warning',
				actionText: 'Erledigt',
				onClick: async () => {
					await habitsState.toggleToday(habit.id);
				}
			});
		}
	}

	// 2. Überfällige Tasks (>2 Tage überfällig, ≥2 Tasks)
	const now = new Date();
	const twoDaysAgo = new Date();
	twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
	const overdueTasks = tasksState.tasks.filter((t) => {
		if (t.status === 'done' || !t.due_at) return false;
		const due = new Date(t.due_at);
		return due < twoDaysAgo;
	});
	if (overdueTasks.length >= 2) {
		list.push({
			id: 'overdue_tasks',
			title: '⚠️ Aufgaben stapeln sich',
			description: `Du hast ${overdueTasks.length} Aufgaben, die seit über 2 Tagen überfällig sind.`,
			icon: '⚠️',
			type: 'warning',
			actionText: 'Ansehen',
			actionRoute: '/tasks'
		});
	}

	// 3. Schlafdefizit (Schlaf < 6h an 3 der letzten 5 eingetragenen Tagen)
	const recentSleepEntries = healthState.entries
		.slice(0, 5)
		.filter((e) => e.sleep_h !== null && e.sleep_h < 6);
	if (recentSleepEntries.length >= 3) {
		list.push({
			id: 'sleep_deficit',
			title: '😴 Schlafdefizit erkannt',
			description: 'Du schläfst in letzter Zeit wenig. Versuche heute früher ins Bett zu gehen.',
			icon: '😴',
			type: 'info',
			actionText: 'Gesundheit logs',
			actionRoute: '/health'
		});
	}

	// 4. Stagnierendes Ziel (14 Tage kein Fortschritt)
	const fourteenDaysAgo = new Date();
	fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
	const stagnatingGoals = goalsState.goals.filter((g) => {
		if (g.status !== 'open') return false;
		const updated = new Date(g.updated_at);
		return updated < fourteenDaysAgo;
	});
	if (stagnatingGoals.length > 0) {
		const first = stagnatingGoals[0];
		list.push({
			id: `stagnating_${first.id}`,
			title: '🎯 Ziel stagniert',
			description: `Kein Update beim Ziel "${first.title}" in den letzten 2 Wochen.`,
			icon: '🎯',
			type: 'info',
			actionText: 'Ziel anpassen',
			actionRoute: '/goals'
		});
	}

	// 5. Kein Journal (3+ Tage kein Eintrag)
	const recentJournalEntries = goalsState.journalEntries.filter(j => j.kind !== 'weekly').map(j => j.date);
	let journalMissingDays = 0;
	for (let i = 1; i <= 3; i++) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		if (!recentJournalEntries.includes(toISODate(d))) {
			journalMissingDays++;
		}
	}
	if (journalMissingDays >= 3) {
		list.push({
			id: 'journal_missing',
			title: '📝 Schreib mal wieder',
			description: 'Reflektiere deine Gedanken der letzten Tage in deinem Tagebuch.',
			icon: '📝',
			type: 'action',
			actionText: 'Tagebuch öffnen',
			actionRoute: '/goals'
		});
	}

	// 6. Wasser Trinken! (0 heute eingetragen)
	const todayHealth = healthState.todayEntry;
	const waterVal = todayHealth ? waterMl(todayHealth) : 0;
	if (waterVal === null || waterVal === 0) {
		list.push({
			id: 'drink_water',
			title: '💧 Denk ans Trinken',
			description: 'Du hast heute noch kein Wasser eingetragen. Trink ein Glas Wasser!',
			icon: '💧',
			type: 'action',
			actionText: '+1 Glas',
			onClick: async () => {
				await healthState.addWater(profileState.glassSizeMl);
				await analyticsState.saveTodayScore();
			}
		});
	}

	// 7. Einkaufsliste voll (> 12 unbesorgte Gegenstände)
	const pendingItems = shoppingState.items.filter((item) => !item.checked);
	if (pendingItems.length > 12) {
		list.push({
			id: 'shopping_full',
			title: '🛒 Einkauf fällig?',
			description: `Deine Einkaufsliste hat ${pendingItems.length} unbesorgte Dinge.`,
			icon: '🛒',
			type: 'info',
			actionText: 'Öffnen',
			actionRoute: '/shopping'
		});
	}

	// 8. Ziel-Deadline naht / hinterher (W8)
	for (const g of goalsState.goals) {
		if (g.status === 'done' || g.archived) continue;
		const track = evaluateTrack(g, getGoalProgress(g));
		if (track.state === 'overdue' || track.state === 'behind') {
			list.push({
				id: `track_${g.id}`,
				title: track.state === 'overdue' ? '⚠️ Ziel überfällig' : '📉 Ziel im Verzug',
				description: `„${g.title}" — ${track.label}`,
				icon: track.state === 'overdue' ? '⚠️' : '📉',
				type: 'warning',
				actionText: 'Ziel öffnen',
				actionRoute: `/goals/${g.id}`
			});
			break;
		}
	}

	// 9. Trainings-Erinnerung (Welle 5.9): Pläne vorhanden, aber ≥ 4 Tage kein Workout
	if (fitnessState.plans.length > 0) {
		const lastWorkout = fitnessState.logs[0]?.date ?? null;
		const fourDaysAgo = new Date();
		fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
		if (!lastWorkout || new Date(lastWorkout) < fourDaysAgo) {
			list.push({
				id: 'workout_due',
				title: '🏋️ Zeit fürs Training',
				description: lastWorkout
					? `Dein letztes Workout war am ${new Date(lastWorkout).toLocaleDateString('de-DE')}.`
					: 'Du hast Trainingspläne — starte dein erstes Workout.',
				icon: '🏋️',
				type: 'action',
				actionText: 'Zum Training',
				actionRoute: '/fitness'
			});
		}
	}

	// 10. Tagebuch (W8)
	if (!goalsState.todayEntry) {
		list.push({
			id: 'journal_today',
			title: 'Tagebuch',
			description: 'Wie war dein Tag?',
			icon: '✍️',
			type: 'action',
			actionText: 'Schreiben',
			actionRoute: '/journal'
		});
	}

	// Fallback if everything is perfect
	if (list.length === 0) {
		list.push({
			id: 'perfect_day',
			title: '🌟 Alles im Griff!',
			description: 'Du hast all deine anstehenden Aufgaben und Routinen gemeistert. Weiter so!',
			icon: '🌟',
			type: 'success'
		});
	}

	return list.slice(0, 3); // Max 3 suggestions shown at a time
}
