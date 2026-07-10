<script lang="ts">
	import { linksState } from '../store.svelte';
	import { searchEntities, entityMeta } from '../registry';
	import type { LinkEntityType } from '../types';

	let {
		open = $bindable(false),
		sourceType,
		sourceId
	}: { open?: boolean; sourceType: LinkEntityType; sourceId: string } = $props();

	let query = $state('');
	let inputEl = $state<HTMLInputElement | undefined>(undefined);

	const results = $derived(searchEntities(query, { type: sourceType, id: sourceId }));

	// bereits verknüpfte IDs ausblenden
	const linkedIds = $derived(
		new Set(
			linksState.linksFor(sourceType, sourceId).map((l) =>
				l.source_type === sourceType && l.source_id === sourceId
					? `${l.target_type}:${l.target_id}`
					: `${l.source_type}:${l.source_id}`
			)
		)
	);
	const filtered = $derived(results.filter((r) => !linkedIds.has(`${r.type}:${r.id}`)));

	async function pick(type: LinkEntityType, id: string) {
		await linksState.add(sourceType, sourceId, type, id);
		query = '';
		open = false;
	}

	function close() {
		open = false;
		query = '';
	}

	$effect(() => {
		if (open) setTimeout(() => inputEl?.focus(), 10);
	});
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-40 bg-black/45 dark:bg-black/60 backdrop-blur-sm" onclick={close}></div>

	<div
		class="fixed inset-x-4 top-[12%] z-50 mx-auto max-w-md rounded-2xl border border-border-color bg-surface-0 shadow-2xl"
		role="dialog"
		aria-label="Verknüpfen"
		aria-modal="true"
	>
		<div class="flex items-center gap-3 border-b border-border-color px-4 py-3">
			<span class="text-text-secondary">🔗</span>
			<input
				bind:this={inputEl}
				bind:value={query}
				onkeydown={(e) => e.key === 'Escape' && close()}
				type="text"
				placeholder="Aufgabe, Notiz, Termin, Ziel oder Routine suchen…"
				class="flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary focus:outline-none"
				autocomplete="off"
			/>
		</div>

		<ul class="max-h-72 overflow-y-auto py-2">
			{#each filtered as entity (entity.type + entity.id)}
				{@const Meta = entityMeta[entity.type]}
				{@const Icon = Meta.icon}
				<li>
					<button
						onclick={() => pick(entity.type, entity.id)}
						class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-2"
					>
						<Icon size={16} class="shrink-0 text-text-tertiary" />
						<span class="min-w-0 flex-1 truncate text-sm text-text-primary">{entity.title}</span>
						<span class="shrink-0 text-[10px] text-text-tertiary">{Meta.label}</span>
					</button>
				</li>
			{:else}
				<li class="px-4 py-3 text-sm text-text-tertiary">Keine Treffer</li>
			{/each}
		</ul>
	</div>
{/if}
