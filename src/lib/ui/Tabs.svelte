<script lang="ts" generics="T extends string">
	import type { Snippet } from 'svelte';

	let {
		tabs,
		value = $bindable(),
		label,
		panel
	}: {
		tabs: { id: T; label: string }[];
		value: T;
		/** Beschreibt die Reiter für Screenreader, z. B. „Ansicht“. */
		label: string;
		/** Inhalt des aktiven Reiters. */
		panel: Snippet<[T]>;
	} = $props();

	const basis = $props.id();
	let liste = $state<HTMLElement | null>(null);

	// Tablist-Muster: Pfeiltasten wechseln und fokussieren, Tab springt in den Inhalt.
	function onkeydown(event: KeyboardEvent) {
		const index = tabs.findIndex((t) => t.id === value);
		let neu = -1;
		if (event.key === 'ArrowRight') neu = (index + 1) % tabs.length;
		else if (event.key === 'ArrowLeft') neu = (index - 1 + tabs.length) % tabs.length;
		else if (event.key === 'Home') neu = 0;
		else if (event.key === 'End') neu = tabs.length - 1;
		if (neu < 0) return;
		event.preventDefault();
		value = tabs[neu].id;
		liste?.querySelectorAll<HTMLElement>('[role="tab"]')[neu]?.focus();
	}
</script>

<div>
	<div
		bind:this={liste}
		role="tablist"
		aria-label={label}
		tabindex="-1"
		{onkeydown}
		class="flex items-end gap-1 overflow-x-auto"
	>
		{#each tabs as tab (tab.id)}
			{@const aktiv = tab.id === value}
			<button
				type="button"
				role="tab"
				id="{basis}-tab-{tab.id}"
				aria-selected={aktiv}
				aria-controls="{basis}-panel-{tab.id}"
				tabindex={aktiv ? 0 : -1}
				onclick={() => (value = tab.id)}
				class="mono-label min-h-[var(--ziel-min)] shrink-0 rounded-t-md border-[length:var(--rahmen)] border-tinte px-4 {aktiv
					? 'relative z-10 -mb-[3px] border-b-flaeche bg-flaeche'
					: 'bg-flaeche-2 hover:bg-flaeche'}"
			>
				{tab.label}
			</button>
		{/each}
	</div>
	{#each tabs as tab (tab.id)}
		<div
			role="tabpanel"
			id="{basis}-panel-{tab.id}"
			aria-labelledby="{basis}-tab-{tab.id}"
			tabindex="0"
			hidden={tab.id !== value}
			class="rounded-b-md border-[length:var(--rahmen)] border-tinte bg-flaeche p-4"
		>
			{#if tab.id === value}{@render panel(tab.id)}{/if}
		</div>
	{/each}
</div>
