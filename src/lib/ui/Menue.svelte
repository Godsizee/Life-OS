<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Ellipsis } from '@lucide/svelte';
	import { platziere } from './popover-position';

	let {
		label,
		trigger,
		ausrichtung = 'ende',
		children
	}: {
		/** Zugänglicher Name der Taste, z. B. „Mehr zu Aufgabe Steuer“. */
		label: string;
		/** Eigener Inhalt der Taste; ohne Angabe steht dort `⋯`. */
		trigger?: Snippet;
		ausrichtung?: 'start' | 'ende';
		/** Die Einträge, meist `MenueEintrag`. */
		children: Snippet;
	} = $props();

	const id = $props.id();
	let pop = $state<HTMLElement | null>(null);
	let taste = $state<HTMLElement | null>(null);
	let offen = $state(false);

	// Popover-API: Escape und Klick daneben schließen, der Fokus kehrt zur Taste zurück.
	function ontoggle(event: Event) {
		offen = (event as ToggleEvent).newState === 'open';
		if (!offen || !pop || !taste) return;
		platziere(pop, taste, ausrichtung);
		pop.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
	}

	function onkeydown(event: KeyboardEvent) {
		const delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
		if (!delta || !pop) return;
		event.preventDefault();
		const eintraege = [...pop.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)')];
		const index = eintraege.indexOf(document.activeElement as HTMLElement);
		eintraege[(index + delta + eintraege.length) % eintraege.length]?.focus();
	}
</script>

<button
	bind:this={taste}
	type="button"
	popovertarget={id}
	aria-label={label}
	aria-haspopup="menu"
	aria-expanded={offen}
	class="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-transparent text-tinte hover:bg-flaeche-2"
>
	{#if trigger}{@render trigger()}{:else}<Ellipsis size={20} />{/if}
</button>

<div
	bind:this={pop}
	{id}
	popover="auto"
	role="menu"
	tabindex="-1"
	aria-label={label}
	{ontoggle}
	{onkeydown}
	class="box fixed inset-auto m-0 min-w-48 p-0"
	style="box-shadow: var(--schatten-s)"
>
	{@render children()}
</div>
