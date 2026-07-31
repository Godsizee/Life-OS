<script lang="ts">
	import Select from '$lib/ui/Select.svelte';
	import { workspaceState } from '../store.svelte';

	let { value, onchange, emptyLabel = 'Niemand zugewiesen' }: {
		value: string | null;
		onchange: (next: string | null) => void;
		emptyLabel?: string;
	} = $props();
</script>

<Select
	value={value ?? ''}
	onchange={(e) => onchange((e.currentTarget as HTMLSelectElement).value || null)}
>
	<option value="">{emptyLabel}</option>
	{#each workspaceState.members as m (m.user_id)}
		<option value={m.user_id}>{m.profile?.display_name ?? 'Unbekannt'}</option>
	{/each}
</Select>
