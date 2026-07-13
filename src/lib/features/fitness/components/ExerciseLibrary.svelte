<script lang="ts">
	import { Search, Trash2, User } from 'lucide-svelte';
	import { fitnessState } from '../store.svelte';
	import CustomExerciseForm from './CustomExerciseForm.svelte';
	import type { ExerciseType } from '../types';

	let query = $state('');
	let activeMuscleGroup = $state<string | null>(null);
	let activeType = $state<ExerciseType | 'all'>('all');

	const TYPE_LABELS: Record<ExerciseType, string> = {
		strength: 'Kraft',
		cardio: 'Cardio',
		duration: 'Zeitbasiert'
	};

	const typeFiltered = $derived(
		activeType === 'all' ? fitnessState.catalog : fitnessState.catalog.filter((e) => e.exercise_type === activeType)
	);
	// Nur Muskelgruppen anbieten, die beim aktuellen Typ-Filter auch vorkommen.
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
	const filteredAll = $derived(
		activeMuscleGroup ? searched.filter((e) => e.muscle_group === activeMuscleGroup) : searched
	);
	const isUnfiltered = $derived(!query.trim() && !activeMuscleGroup && activeType === 'all');
	const DISPLAY_CAP = 40;
	const filtered = $derived(isUnfiltered ? filteredAll.slice(0, DISPLAY_CAP) : filteredAll);

	const customExercises = $derived(fitnessState.catalog.filter((e) => e.workspace_id !== null));

	async function handleDelete(id: string) {
		await fitnessState.removeCustomExercise(id);
	}
</script>

<div class="space-y-6">
	<!-- Suche + Filter -->
	<div class="glass-card rounded-2xl p-4 premium-shadow space-y-3">
		<div class="flex items-center gap-2 rounded-xl border border-border-color bg-surface-0 px-3">
			<Search size={16} class="shrink-0 text-text-tertiary" />
			<input
				bind:value={query}
				type="text"
				placeholder="Übung suchen…"
				class="min-h-10 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
				autocomplete="off"
			/>
		</div>

		<div class="flex gap-2 overflow-x-auto pb-1">
			<button
				onclick={() => (activeType = 'all')}
				class="shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all
					{activeType === 'all'
					? 'bg-primary-700 text-white border-primary-700 dark:bg-primary-600 dark:border-primary-600'
					: 'bg-surface-0 text-text-secondary border-border-color hover:bg-surface-1'}"
			>
				Alle Typen
			</button>
			{#each Object.entries(TYPE_LABELS) as [type, label]}
				<button
					onclick={() => (activeType = activeType === type ? 'all' : (type as ExerciseType))}
					class="shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all
						{activeType === type
						? 'bg-primary-700 text-white border-primary-700 dark:bg-primary-600 dark:border-primary-600'
						: 'bg-surface-0 text-text-secondary border-border-color hover:bg-surface-1'}"
				>
					{label}
				</button>
			{/each}
		</div>

		{#if muscleGroups.length > 0}
			<div class="flex gap-2 overflow-x-auto pb-1">
				<button
					onclick={() => (activeMuscleGroup = null)}
					class="shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all
						{activeMuscleGroup === null
						? 'bg-primary-700 text-white border-primary-700 dark:bg-primary-600 dark:border-primary-600'
						: 'bg-surface-0 text-text-secondary border-border-color hover:bg-surface-1'}"
				>
					Alle Muskelgruppen
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
	</div>

	<!-- Ergebnisliste -->
	<div class="space-y-2">
		{#each filtered as entry (entry.id)}
			<div class="glass-card rounded-2xl p-4 premium-shadow flex items-center justify-between gap-3">
				<div class="min-w-0">
					<h4 class="font-bold text-sm text-text-primary truncate">{entry.name_de}</h4>
					{#if entry.name_en && entry.name_en !== entry.name_de}
						<p class="text-xs text-text-tertiary truncate">{entry.name_en}</p>
					{/if}
				</div>
				<div class="flex shrink-0 items-center gap-1.5">
					{#if entry.muscle_group}
						<span class="rounded-full border border-border-color bg-surface-2 px-2 py-0.5 text-[11px] text-text-tertiary">
							{entry.muscle_group}
						</span>
					{/if}
					<span class="rounded-full border border-border-color bg-surface-2 px-2 py-0.5 text-[11px] text-text-tertiary">
						{TYPE_LABELS[entry.exercise_type]}
					</span>
				</div>
			</div>
		{:else}
			<div class="text-center py-8 text-text-tertiary border border-dashed border-border-color rounded-2xl text-sm">
				Keine Übungen gefunden.
			</div>
		{/each}
		{#if isUnfiltered && filteredAll.length > DISPLAY_CAP}
			<p class="text-center text-xs text-text-tertiary py-1">
				{filteredAll.length - DISPLAY_CAP} weitere — tippe zum Suchen oder wähle einen Filter
			</p>
		{/if}
	</div>

	<!-- Eigene Übungen verwalten -->
	<div class="glass-card rounded-2xl p-4 premium-shadow space-y-3">
		<h3 class="text-xs font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1.5">
			<User size={12} />
			<span>Eigene Übungen</span>
		</h3>
		{#if customExercises.length > 0}
			<ul class="space-y-2">
				{#each customExercises as entry (entry.id)}
					<li class="flex items-center justify-between text-xs text-text-secondary bg-surface-1/50 px-3 py-2 rounded-lg border border-border-color">
						<span class="truncate">{entry.name_de}{#if entry.muscle_group} ({entry.muscle_group}){/if}</span>
						<button
							onclick={() => handleDelete(entry.id)}
							aria-label="Übung löschen"
							class="ml-2 shrink-0 text-red-400 hover:text-red-600 transition-colors flex items-center"
						>
							<Trash2 size={13} />
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-xs text-text-tertiary">Noch keine eigenen Übungen angelegt.</p>
		{/if}
		<CustomExerciseForm onCreated={() => {}} />
	</div>
</div>
