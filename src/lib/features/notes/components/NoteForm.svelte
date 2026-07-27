<script lang="ts">
	import { Lock, LockOpen } from 'lucide-svelte';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Field from '$lib/ui/Field.svelte';
	import { notesState } from '../store.svelte';

	let { onsubmitted }: { onsubmitted?: () => void } = $props();

	let title = $state('');
	let body = $state('');
	let isPrivate = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!title.trim()) return;
		await notesState.addNote({ title: title.trim(), body, private: isPrivate });
		title = '';
		body = '';
		isPrivate = false;
		onsubmitted?.();
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-3">
	<Field label="Titel">
		<Input placeholder="Neue Notiz…" bind:value={title} required />
	</Field>

	<Field label="Inhalt" hint="Optional — Markdown und Checklisten (- [ ]) erlaubt">
		<Textarea bind:value={body} surface="1" rows={4} placeholder="Schreib los…" />
	</Field>

	<button
		type="button"
		onclick={() => (isPrivate = !isPrivate)}
		class="flex min-h-12 items-center gap-2 rounded-xl border border-border-color px-3 text-sm font-medium {isPrivate
			? 'text-primary-700 dark:text-primary-400'
			: 'text-text-secondary'}"
	>
		{#if isPrivate}<Lock size={16} />Nur für mich{:else}<LockOpen size={16} />Mit dem Workspace geteilt{/if}
	</button>

	<Button type="submit">
		{#snippet children()}
			Hinzufügen
		{/snippet}
	</Button>
</form>
