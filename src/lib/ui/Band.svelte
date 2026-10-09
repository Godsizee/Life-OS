<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variante = 'status',
		aktion,
		children
	}: {
		/** `modus` = aktiver Modus (Signal), `status` = Zustand, `update` = neue Version (Info), `fehler` = etwas ging nicht (Gefahr). */
		variante?: 'modus' | 'status' | 'update' | 'fehler';
		/** Rechts, z. B. eine Taste „Beenden“. */
		aktion?: Snippet;
		children: Snippet;
	} = $props();

	const farben = {
		modus: 'bg-signal text-auf-farbe',
		status: 'bg-flaeche-2 text-tinte',
		update: 'bg-info text-auf-info',
		fehler: 'bg-gefahr text-auf-gefahr'
	};
</script>

<!-- Der Text trägt die Bedeutung; die Farbe zeigt nur die Art. -->
<div
	role="status"
	class="mono-label flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-y-[length:var(--rahmen-s)] border-tinte px-3 py-1.5 {farben[
		variante
	]}"
>
	<span class="min-w-0">{@render children()}</span>
	{#if aktion}<span class="shrink-0">{@render aktion()}</span>{/if}
</div>
