<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		leading,
		trailing,
		children,
		align = 'center',
		class: className = ''
	}: {
		leading?: Snippet;
		trailing?: Snippet;
		children?: Snippet;
		align?: 'center' | 'start';
		class?: string;
	} = $props();
</script>

<!-- Zeile mit Trennlinie unten, keine Box je Zeile; die letzte Zeile einer Liste braucht keine Linie. -->
<div
	class="flex min-h-[var(--ziel-min)] gap-3 border-b-[length:var(--rahmen-s)] border-tinte py-3 last:border-b-0 {align ===
	'start'
		? 'items-start'
		: 'items-center'} {className}"
>
	{#if leading}
		<div class="shrink-0">{@render leading()}</div>
	{/if}
	<div class="min-w-0 flex-1">
		{@render children?.()}
	</div>
	{#if trailing}
		<div class="shrink-0">{@render trailing()}</div>
	{/if}
</div>
