<script lang="ts">
	import { Search, X, Clock, Plus } from 'lucide-svelte';
	import { fitnessState } from '../store.svelte';
	import CustomExerciseForm from './CustomExerciseForm.svelte';
	import type { ExerciseCatalogEntry, ExerciseType, PickedExercise } from '../types';

	let {
		open = $bindable(false),
		filterType = null,
		onSelect
	}: {
		open?: boolean;
		filterType?: ExerciseType | null;
		onSelect: (picked: PickedExercise) => void;
	} = $props();

	let query = $state('');
	let activeMuscleGroup = $state<string | null>(null);
	let showCustomForm = $state(false);
	let inputEl = $state<HTMLInputElement | undefined>(undefined);

	const typeFiltered = $derived(
		filterType ? fitnessState.catalog.filter((e) => e.exercise_type === filterType) : fitnessState.catalog
	);
	// Nur Muskelgruppen anbieten, die im (typ-gefilterten) Ergebnis auch vorkommen —
	// sonst könnten Chips wie „Cardio" in einem strength-only Picker leer laufen.
	const muscleGroups = $derived(
		[...new Set(typeFiltered.map((e) => e.muscle_group).filter((v): v is string => !!v))].sort()
	);
	const searched = $derived(
		(() => {
			const q = query.trim().toLowerCase();
			if (!q) return typeFiltered;
			return typeFiltered.filter(
				(e) => e.name_de.toLowerCase().includes(q) || (e.name_en?.toLowerCase().includes(q) ?? false)
			);
		})()
	);
	const DISPLAY_CAP = 40;
	const filteredAll = $derived(
		activeMuscleGroup ? searched.filter((e) => e.muscle_group === activeMuscleGroup) : searched
	);
	const isUnfiltered = $derived(!query.trim() && !activeMuscleGroup);
	// Ohne Suche/Filter nur eine Vorschau rendern statt ~800 Zeilen ins DOM zu hängen.
	const filtered = $derived(isUnfiltered ? filteredAll.slice(0, DISPLAY_CAP) : filteredAll);
	const showRecent = $derived(isUnfiltered);
	const recentFiltered = $derived(
		filterType
			? fitnessState.recentExercises.filter((r) => r.exercise_type === filterType)
			: fitnessState.recentExercises
	);

	function pick(entry: ExerciseCatalogEntry) {
		onSelect({ exercise_id: entry.id, name: entry.name_de, exercise_type: entry.exercise_type });
		close();
	}

	function pickRecent(r: PickedExercise) {
		onSelect(r);
		close();
	}

	function handleCreated(picked: PickedExercise) {
		onSelect(picked);
		close();
	}

	function close() {
		open = false;
		query = '';
		activeMuscleGroup = null;
		showCustomForm = false;
	}

	$effect(() => {
		if (open) {
			void fitnessState.loadRecentExercises();
			setTimeout(() => inputEl?.focus(), 10);
		}
	});
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-40 bg-black/45 dark:bg-black/60 backdrop-blur-sm" onclick={close}></div>

	<div
		data-noswipe
		class="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-2xl border-t border-border-color bg-surface-0 shadow-2xl flex flex-col"
		role="dialog"
		aria-label="Übung auswählen"
		aria-modal="true"
	>
		<div class="flex items-center justify-between px-4 pt-3 pb-2">
			<h3 class="text-sm font-bold text-text-primary">Übung auswählen</h3>
			<button
				onclick={close}
				aria-label="Schließen"
				class="flex h-9 w-9 items-center justify-center rounded-lg text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
			>
				<X size={16} />
			</button>
		</div>

		<div class="flex items-center gap-2 border-b border-border-color px-4 pb-3">
			<Search size={16} class="shrink-0 text-text-tertiary" />
			<input
				bind:this={inputEl}
				bind:value={query}
				onkeydown={(e) => e.key === 'Escape' && close()}
				type="text"
				placeholder="Übung suchen…"
				class="min-h-9 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
				autocomplete="off"
			/>
		</div>

		{#if muscleGroups.length > 0}
			<div class="flex gap-2 overflow-x-auto px-4 py-2">
				<button
					onclick={() => (activeMuscleGroup = null)}
					class="shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all
						{activeMuscleGroup === null
						? 'bg-primary-700 text-white border-primary-700 dark:bg-primary-600 dark:border-primary-600'
						: 'bg-surface-0 text-text-secondary border-border-color hover:bg-surface-1'}"
				>
					Alle
				</button>
				{#each muscleGroups as group}
					<button
						onclick={() => (activeMuscleGroup = activeMuscleGroup === group ? null : group)}
						class="shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all
							{activeMuscleGroup === group
							? 'bg-primary-700 text-white border-primary-700 dark:bg-primary-600 dark:border-primary-600'
							: 'bg-surface-0 text-text-secondary border-border-color hover:bg-surface-1'}"
					>
						{group}
					</button>
				{/each}
			</div>
		{/if}

		<div class="flex-1 overflow-y-auto px-2 pb-2">
			{#if showRecent && recentFiltered.length > 0}
				<div class="px-2 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1">
					<Clock size={11} />
					<span>Zuletzt verwendet</span>
				</div>
				<ul>
					{#each recentFiltered as r}
						<li>
							<button
								onclick={() => pickRecent(r)}
								class="flex w-full min-h-11 items-center gap-3 rounded-lg px-3 text-left transition-colors hover:bg-surface-2"
							>
								<span class="min-w-0 flex-1 truncate text-sm text-text-primary">{r.name}</span>
							</button>
						</li>
					{/each}
				</ul>
				<div class="my-1 border-t border-border-color"></div>
			{/if}

			<ul>
				{#each filtered as entry (entry.id)}
					<li>
						<button
							onclick={() => pick(entry)}
							class="flex w-full min-h-12 items-center gap-3 rounded-lg px-3 text-left transition-colors hover:bg-surface-2"
						>
							<span class="min-w-0 flex-1 truncate text-sm text-text-primary">{entry.name_de}</span>
							{#if entry.muscle_group}
								<span class="shrink-0 rounded-full border border-border-color bg-surface-2 px-2 py-0.5 text-[11px] text-text-tertiary">
									{entry.muscle_group}
								</span>
							{/if}
						</button>
					</li>
				{:else}
					<li class="px-3 py-6 text-center text-sm text-text-tertiary">Keine Treffer</li>
				{/each}
			</ul>
			{#if isUnfiltered && filteredAll.length > DISPLAY_CAP}
				<p class="px-3 py-2 text-center text-xs text-text-tertiary">
					{filteredAll.length - DISPLAY_CAP} weitere — tippe zum Suchen oder wähle eine Muskelgruppe
				</p>
			{/if}
		</div>

		<div class="border-t border-border-color p-3">
			{#if showCustomForm}
				<CustomExerciseForm onCreated={handleCreated} />
			{:else}
				<button
					onclick={() => (showCustomForm = true)}
					class="w-full min-h-10 rounded-xl border-2 border-dashed border-border-color text-text-secondary hover:border-primary-400 hover:text-text-primary dark:hover:border-primary-700 transition-all flex items-center justify-center gap-2 text-xs font-bold"
				>
					<Plus size={14} />
					<span>Eigene Übung anlegen</span>
				</button>
			{/if}
		</div>
	</div>
{/if}
