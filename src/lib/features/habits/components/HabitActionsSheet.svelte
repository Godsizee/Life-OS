<script lang="ts">
	import Sheet from '$lib/ui/Sheet.svelte';
	import type { Habit } from '../types';
	import { habitsState } from '../store.svelte';
	import { CheckSquare, Ban, Edit2, Archive, Activity } from 'lucide-svelte';
	import HabitForm from './HabitForm.svelte';
	import { isSkipped } from '../streak';

	interface Props {
		open: boolean;
		habit: Habit | null;
		onClose: () => void;
	}

	let { open = $bindable(false), habit, onClose }: Props = $props();

	let editOpen = $state(false);

	async function handleSkip() {
		if (habit) await habitsState.toggleSkipToday(habit.id);
		open = false;
		onClose();
	}

	async function handleArchive() {
		if (habit && confirm(`Möchtest du die Routine "${habit.name}" wirklich archivieren?`)) {
			await habitsState.archiveHabit(habit.id);
			open = false;
			onClose();
		}
	}
</script>

<Sheet bind:open title={habit?.name ?? 'Optionen'}>
	{#if habit}
		{@const day = habitsState.entryToday(habit.id)}
		{@const skipped = isSkipped(day)}
		
		<div class="flex flex-col p-2">
			<!-- Link zur Detailseite -->
			<a
				href={`/habits/${habit.id}`}
				onclick={() => {
					open = false;
					onClose();
				}}
				class="flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-surface-1"
			>
				<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30">
					<Activity size={20} />
				</div>
				<div class="flex flex-col">
					<span class="text-sm font-semibold text-text-primary">Statistiken ansehen</span>
					<span class="text-xs text-text-secondary">Verlauf & Streaks im Detail</span>
				</div>
			</a>

			<hr class="my-2 border-border-color" />

			<!-- Skip -->
			<button
				onclick={handleSkip}
				class="flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-surface-1"
			>
				<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-text-secondary">
					<Ban size={20} />
				</div>
				<div class="flex flex-col">
					<span class="text-sm font-semibold text-text-primary">
						{skipped ? 'Skip aufheben' : 'Heute überspringen'}
					</span>
					<span class="text-xs text-text-secondary">Schützt deine Serie bei Krankheit/Urlaub</span>
				</div>
			</button>

			<!-- Edit -->
			<button
				onclick={() => {
					editOpen = true;
				}}
				class="flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-surface-1"
			>
				<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-text-secondary">
					<Edit2 size={20} />
				</div>
				<div class="flex flex-col">
					<span class="text-sm font-semibold text-text-primary">Bearbeiten</span>
					<span class="text-xs text-text-secondary">Name, Rhythmus oder Zielwert anpassen</span>
				</div>
			</button>

			<hr class="my-2 border-border-color" />

			<!-- Archive -->
			<button
				onclick={handleArchive}
				class="flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
			>
				<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30">
					<Archive size={20} />
				</div>
				<div class="flex flex-col">
					<span class="text-sm font-semibold text-red-600">Archivieren</span>
					<span class="text-xs text-red-500/70">Wird aus der aktuellen Liste entfernt</span>
				</div>
			</button>
		</div>
	{/if}
</Sheet>

<Sheet bind:open={editOpen} title="Routine bearbeiten">
	<div class="p-4">
		{#if habit}
			<HabitForm
				initialData={habit}
				onsubmitted={() => {
					editOpen = false;
					open = false;
					onClose();
				}}
				oncancel={() => (editOpen = false)}
			/>
		{/if}
	</div>
</Sheet>
