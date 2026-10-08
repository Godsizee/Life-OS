<script lang="ts">
	let {
		label,
		hint,
		children
	}: {
		label: string;
		/** Ein Satz, der sagt, was die Einstellung bewirkt (Pflicht, wenn sie nicht selbsterklärend ist). */
		hint?: string;
		children: import('svelte').Snippet;
	} = $props();
</script>

<div class="flex min-h-14 items-center justify-between gap-4 px-2 py-2">
	<div class="min-w-0">
		<p class="text-sm font-semibold text-tinte">{label}</p>
		{#if hint}
			<p class="mt-0.5 text-xs text-text-2">{hint}</p>
		{/if}
	</div>
	<div class="shrink-0">{@render children()}</div>
</div>
