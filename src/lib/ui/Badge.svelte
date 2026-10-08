<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'neutral',
		children
	}: {
		variant?: 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';
		children: Snippet;
	} = $props();

	// Kleines Etikett im Stil von Sticker/StatusBadge. Für Status mit festen Wörtern
	// gibt es `StatusBadge`; dies hier trägt freien Text (Zähler, Namen).
	const variants = {
		neutral: 'bg-flaeche-2 text-tinte',
		primary: 'bg-signal text-auf-farbe',
		accent: 'bg-signal text-auf-farbe',
		success: 'bg-erfolg text-auf-erfolg',
		warning: 'bg-mod-shopping text-auf-farbe',
		danger: 'bg-gefahr text-auf-gefahr'
	};
</script>

<span
	class="mono-label nums-tabular inline-flex items-center rounded-sm border-[length:var(--rahmen-s)] border-tinte px-1.5 py-0.5 {variants[
		variant
	]}"
>
	{@render children()}
</span>
