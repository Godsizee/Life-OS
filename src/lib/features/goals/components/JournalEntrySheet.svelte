<script lang="ts">
	// W8 — Formular-Sheet für Tagebuch-Einträge (neu anlegen oder bearbeiten).
	import Sheet from '$lib/ui/Sheet.svelte';
	import JournalEntryForm from './JournalEntryForm.svelte';
	import { formatShortDate } from '$lib/core/date';

	let {
		date,
		kind = 'daily',
		open = $bindable(false)
	}: {
		date: string | null;
		kind?: 'daily' | 'weekly';
		open?: boolean;
	} = $props();
</script>

<Sheet bind:open title={date ? `Eintrag vom ${formatShortDate(date)}` : 'Tagebuch'}>
	{#snippet children()}
		{#if date}
			<div class="p-4">
				<JournalEntryForm
					{date}
					{kind}
					onsubmitted={() => {
						open = false;
					}}
				/>
			</div>
		{/if}
	{/snippet}
</Sheet>
