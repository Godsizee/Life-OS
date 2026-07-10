<script lang="ts">
	import { goto } from '$app/navigation';
	import { linksState } from '../store.svelte';
	import { resolveEntity, entityMeta } from '../registry';
	import type { LinkEntityType } from '../types';
	import LinkPicker from './LinkPicker.svelte';
	import { X, Link2, Plus } from 'lucide-svelte';

	let { type, id }: { type: LinkEntityType; id: string } = $props();

	let pickerOpen = $state(false);

	// Für jeden Link die „andere Seite" bestimmen und auflösen.
	const linked = $derived(
		linksState.linksFor(type, id).map((l) => {
			const other =
				l.source_type === type && l.source_id === id
					? { type: l.target_type, id: l.target_id }
					: { type: l.source_type, id: l.source_id };
			return { linkId: l.id, otherType: other.type, entity: resolveEntity(other.type, other.id) };
		})
	);
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<h3 class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-tertiary">
			<Link2 size={13} /> Verknüpfungen
		</h3>
		<button
			onclick={() => (pickerOpen = true)}
			class="inline-flex items-center gap-1 text-xs font-semibold text-primary-active hover:underline"
		>
			<Plus size={13} /> Verknüpfen
		</button>
	</div>

	{#if linked.length > 0}
		<ul class="flex flex-col gap-1.5">
			{#each linked as item (item.linkId)}
				{#if item.entity}
					{@const Meta = entityMeta[item.otherType]}
					{@const Icon = Meta.icon}
					<li class="flex items-center gap-2 rounded-lg border border-border-color bg-surface-1 px-2.5 py-1.5">
						<Icon size={14} class="shrink-0 text-text-tertiary" />
						<button
							onclick={() => goto(Meta.route(item.entity!.id))}
							class="min-w-0 flex-1 truncate text-left text-sm text-text-primary hover:underline"
						>
							{item.entity.title}
						</button>
						<span class="shrink-0 text-[10px] text-text-tertiary">{Meta.label}</span>
						<button
							onclick={() => linksState.remove(item.linkId)}
							aria-label="Verknüpfung entfernen"
							class="shrink-0 text-text-tertiary hover:text-red-500"
						>
							<X size={14} />
						</button>
					</li>
				{/if}
			{/each}
		</ul>
	{:else}
		<p class="text-xs text-text-tertiary">Noch nichts verknüpft.</p>
	{/if}
</div>

<LinkPicker bind:open={pickerOpen} sourceType={type} sourceId={id} />
