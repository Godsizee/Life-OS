<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		onclick,
		gefahr = false,
		disabled = false,
		children
	}: {
		onclick: (event: MouseEvent) => void;
		/** Zerstörerische Aktion: Text in Gefahr-Farbe plus Symbol im Inhalt. */
		gefahr?: boolean;
		disabled?: boolean;
		children: Snippet;
	} = $props();

	function klick(event: MouseEvent) {
		onclick(event);
		// Das Menü schließt nach der Wahl; der Fokus kehrt zur Menü-Taste zurück.
		(event.currentTarget as HTMLElement).closest<HTMLElement>('[popover]')?.hidePopover();
	}
</script>

<button
	type="button"
	role="menuitem"
	{disabled}
	onclick={klick}
	class="flex min-h-[var(--ziel-min)] w-full items-center gap-2 border-b-[length:var(--rahmen-s)] border-tinte px-4 text-left text-sm font-semibold last:border-b-0 hover:bg-flaeche-2 disabled:opacity-50 {gefahr
		? 'text-gefahr'
		: 'text-tinte'}"
>
	{@render children()}
</button>
