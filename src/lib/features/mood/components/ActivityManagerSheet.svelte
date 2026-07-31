<script lang="ts">
	import Sheet from '$lib/ui/Sheet.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Button from '$lib/ui/Button.svelte';
	import { customActivitiesWithCounts, activityLabel, normalizeActivity } from '../activities';
	import { moodState } from '../store.svelte';
	import { Edit2, Trash2, Check, X } from 'lucide-svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let editingTag = $state<string | null>(null);
	let newName = $state('');

	const customTags = $derived(customActivitiesWithCounts(moodState.entries));

	function startEdit(tag: string) {
		editingTag = tag;
		newName = activityLabel(tag);
	}

	function cancelEdit() {
		editingTag = null;
		newName = '';
	}

	async function saveRename(tag: string) {
		const normalized = normalizeActivity(newName);
		if (!normalized) return;
		await moodState.renameActivity(tag, normalized);
		cancelEdit();
	}

	async function deleteTag(tag: string, count: number) {
		if (confirm(`Tag "${activityLabel(tag)}" wirklich löschen? Er wird aus ${count} Eintrag/Einträgen entfernt.`)) {
			await moodState.renameActivity(tag, null);
		}
	}
</script>

<Sheet bind:open title="Eigene Tags verwalten">
	<div class="space-y-4 p-4">
		<p class="text-xs text-text-tertiary">
			Hier kannst du deine selbst erstellten Aktivitäts-Tags umbenennen oder löschen.
			Ältere Jahre werden erst angepasst, wenn sie im Jahresraster geladen wurden.
		</p>

		{#if customTags.length === 0}
			<p class="py-4 text-center text-sm text-text-secondary">
				Noch keine eigenen Tags erstellt.
			</p>
		{:else}
			<ul class="flex flex-col gap-2">
				{#each customTags as item (item.tag)}
					<li class="flex items-center justify-between gap-2 rounded-xl border border-border-color bg-surface-1 p-2.5">
						{#if editingTag === item.tag}
							<div class="flex flex-1 items-center gap-1.5">
								<Input bind:value={newName} placeholder="Neuer Name" />
								<button
									onclick={() => saveRename(item.tag)}
									aria-label="Speichern"
									class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white"
								>
									<Check size={16} />
								</button>
								<button
									onclick={cancelEdit}
									aria-label="Abbrechen"
									class="flex h-10 w-10 items-center justify-center rounded-lg border border-border-color bg-surface-2 text-text-secondary"
								>
									<X size={16} />
								</button>
							</div>
						{:else}
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-semibold text-text-primary">
									#{activityLabel(item.tag)}
								</p>
								<p class="text-[11px] text-text-tertiary">
									{item.count} {item.count === 1 ? 'Eintrag' : 'Einträge'}
								</p>
							</div>
							<div class="flex items-center gap-1">
								<button
									onclick={() => startEdit(item.tag)}
									aria-label="Umbenennen"
									class="p-1.5 text-text-tertiary hover:text-text-primary"
								>
									<Edit2 size={16} />
								</button>
								<button
									onclick={() => deleteTag(item.tag, item.count)}
									aria-label="Löschen"
									class="p-1.5 text-text-tertiary hover:text-red-500"
								>
									<Trash2 size={16} />
								</button>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</Sheet>
