<script lang="ts">
	import type { Snippet } from 'svelte';
	import { CircleAlert } from '@lucide/svelte';

	let {
		label,
		hint,
		error,
		id,
		children
	}: {
		label?: string;
		hint?: string;
		error?: string;
		/** Wenn gesetzt, trägt der Fehlertext die id `<id>-error` — der Aufrufer
		 *  verdrahtet sie am Eingabefeld per aria-describedby. */
		id?: string;
		children: Snippet;
	} = $props();
</script>

<label class="flex flex-col gap-1.5">
	{#if label}
		<span class="mono-label text-text-2">{label}</span>
	{/if}
	{@render children()}
	{#if error}
		<!-- Fehler sind nie nur Farbe: Symbol, Text und roter Rahmen am Feld. -->
		<span
			id={id ? `${id}-error` : undefined}
			role="alert"
			class="flex items-start gap-1.5 text-sm font-medium text-tinte"
		>
			<CircleAlert size={16} class="mt-0.5 shrink-0 text-gefahr" />
			{error}
		</span>
	{:else if hint}
		<span class="text-sm text-text-2">{hint}</span>
	{/if}
</label>
