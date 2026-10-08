<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronDown } from '@lucide/svelte';

	let {
		titel,
		offen = $bindable(false),
		children
	}: {
		titel: string;
		offen?: boolean;
		children: Snippet;
	} = $props();
</script>

<!-- Nativ: <details> bringt Tastatur (Enter, Leertaste) und Zustandsansage mit. -->
<details
	class="box group"
	open={offen}
	ontoggle={(e) => (offen = (e.currentTarget as HTMLDetailsElement).open)}
>
	<summary
		class="mono-label flex min-h-[var(--ziel-min)] cursor-pointer list-none items-center justify-between gap-3 px-3 [&::-webkit-details-marker]:hidden"
	>
		{titel}
		<ChevronDown size={18} class="shrink-0 transition-transform group-open:rotate-180" />
	</summary>
	<div class="border-t-[length:var(--rahmen-s)] border-tinte p-3">
		{@render children()}
	</div>
</details>
