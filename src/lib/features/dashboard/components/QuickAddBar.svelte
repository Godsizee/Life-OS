<script lang="ts">
	import { Plus, CheckSquare, ShoppingCart, Calendar, Activity, Flame, Notebook, Target } from 'lucide-svelte';
	import { parseNLPInput } from '$lib/core/nlp-parse';
	import { toastState } from '$lib/core/toast.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { shoppingState } from '$lib/features/shopping/store.svelte';
	import { calendarState } from '$lib/features/calendar/store.svelte';
	import { healthState } from '$lib/features/health/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { moodState } from '$lib/features/mood/store.svelte';
	import { notesState } from '$lib/features/notes/store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import { analyticsState } from '$lib/features/analytics/store.svelte';
	import { dispatchNLP } from '$lib/features/dashboard/nlp-dispatch';

	let quickAdd = $state('');
	const parsedResult = $derived(quickAdd ? parseNLPInput(quickAdd) : null);
	
	const parsedBadge = $derived.by((): { text: string; color: string; icon: any } | null => {
		if (!parsedResult) return null;
		switch (parsedResult.type) {
			case 'task': return { text: 'Aufgabe', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900', icon: CheckSquare };
			case 'shopping': return { text: 'Einkauf', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900', icon: ShoppingCart };
			case 'event': return { text: 'Kalender', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900', icon: Calendar };
			case 'health': return { text: 'Gesundheit', color: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-900', icon: Activity };
			case 'habit': return { text: 'Routine', color: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-900', icon: Flame };
			case 'note': return { text: 'Notiz', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900', icon: Notebook };
			case 'goal': return { text: 'Ziel', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900', icon: Target };
			default: return null;
		}
	});

	async function submitQuickAdd(e: SubmitEvent) {
		e.preventDefault();
		const text = quickAdd.trim();
		if (!text) return;

		try {
			await dispatchNLP(text);
			quickAdd = '';
			await analyticsState.saveTodayScore();
		} catch (err) {
			console.error(err);
			// toastState.error is already handled inside dispatchNLP in most cases, or dispatchNLP returns status.
		}
	}
</script>

<form onsubmit={submitQuickAdd} class="relative space-y-2">
	<div class="relative flex items-center">
		<input
			id="quick-add-input"
			bind:value={quickAdd}
			placeholder="Schnelleingabe… (z.B. 3x Eier, Morgen 10:00 Meeting, 75kg, Laufen) (Taste n)"
			class="min-h-12 w-full rounded-2xl border border-border-color bg-surface-0 pl-4 pr-12 text-base text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none premium-shadow"
		/>
		<button
			type="submit"
			class="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700 text-white hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 active:scale-95 transition-all"
		>
			<Plus size={18} />
		</button>
	</div>

	<!-- Parsing Badge -->
	<div class="px-1">
		{#if parsedBadge}
			{@const Badge = parsedBadge!}
			{@const BadgeIcon = Badge.icon}
			<span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold {Badge.color}">
				<BadgeIcon size={12} />
				<span>Erkannt: {Badge.text}</span>
			</span>
		{/if}
	</div>
</form>
