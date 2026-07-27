<script lang="ts">
	// W9 — Daylio-Aktivitaeten: Katalog nach Gruppen + eigene Tags aus der Historie
	// + Freitext-Eingabe. Dumm gehalten: kein Store-Zugriff, alles ueber Props.
	import { Plus } from 'lucide-svelte';
	import {
		activityLabel,
		customActivities,
		groupedCatalog,
		normalizeActivity,
		toggleActivity
	} from '../activities';
	import { activityIcon } from '../activity-icons';

	let {
		value = $bindable<string[]>([]),
		history = []
	}: {
		value?: string[];
		/** Bisherige Eintraege — Quelle fuer die eigenen Tags. */
		history?: { activities?: string[] | null }[];
	} = $props();

	const groups = groupedCatalog();
	const own = $derived(customActivities(history));
	/** Eigene Tags, die im aktuellen Eintrag stehen, aber (noch) nicht in der Historie. */
	const ownAll = $derived([
		...own,
		...value.filter((id) => !own.includes(id) && !groups.some((g) => g.activities.some((a) => a.id === id)))
	]);

	let newTag = $state('');

	function toggle(id: string) {
		value = toggleActivity(value, id);
	}

	function addCustom() {
		const id = normalizeActivity(newTag);
		newTag = '';
		if (!id || value.includes(id)) return;
		value = [...value, id];
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addCustom();
		}
	}
</script>

<div class="flex flex-col gap-3">
	{#each groups as { group, activities } (group.id)}
		{@const Icon = activityIcon(group.id)}
		<div>
			<p class="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
				<Icon size={12} />
				{group.label}
			</p>
			<div class="flex flex-wrap gap-1.5">
				{#each activities as activity (activity.id)}
					{@const selected = value.includes(activity.id)}
					<button
						type="button"
						onclick={() => toggle(activity.id)}
						aria-pressed={selected}
						class="min-h-9 rounded-full border px-3 text-xs font-semibold transition-all active:scale-95
							{selected
								? 'border-primary-700 bg-primary-700 text-white dark:border-primary-600 dark:bg-primary-600'
								: 'border-border-color bg-surface-0 text-text-secondary hover:bg-surface-1'}"
					>
						{activity.label}
					</button>
				{/each}
			</div>
		</div>
	{/each}

	{#if ownAll.length > 0}
		<div>
			<p class="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Eigene</p>
			<div class="flex flex-wrap gap-1.5">
				{#each ownAll as id (id)}
					{@const selected = value.includes(id)}
					<button
						type="button"
						onclick={() => toggle(id)}
						aria-pressed={selected}
						class="min-h-9 rounded-full border px-3 text-xs font-semibold transition-all active:scale-95
							{selected
								? 'border-primary-700 bg-primary-700 text-white dark:border-primary-600 dark:bg-primary-600'
								: 'border-border-color bg-surface-0 text-text-secondary hover:bg-surface-1'}"
					>
						{activityLabel(id)}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<div class="flex items-center gap-2">
		<input
			bind:value={newTag}
			onkeydown={onKey}
			maxlength="24"
			placeholder="Eigene Aktivität…"
			aria-label="Eigene Aktivität hinzufügen"
			class="min-h-11 min-w-0 flex-1 rounded-xl border border-border-color bg-surface-0 px-3 text-sm text-text-primary placeholder:text-text-tertiary transition-colors duration-200 focus:border-primary-500 focus:outline-none"
		/>
		<button
			type="button"
			onclick={addCustom}
			disabled={!normalizeActivity(newTag)}
			aria-label="Aktivität hinzufügen"
			class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-color bg-surface-2 text-text-primary transition-all active:scale-95 disabled:opacity-40"
		>
			<Plus size={18} />
		</button>
	</div>
</div>
