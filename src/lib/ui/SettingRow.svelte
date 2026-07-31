<script lang="ts">
	let { label, hint, children }: {
		label: string;
		hint?: string;
		children: import('svelte').Snippet;
	} = $props();
</script>

<div class="flex min-h-14 items-center justify-between gap-4 px-2 py-2">
	<div class="min-w-0">
		<p class="text-sm font-medium text-text-primary">{label}</p>
		{#if hint}
			<p class="mt-0.5 text-xs text-text-tertiary">{hint}</p>
		{/if}
	</div>
	<div class="shrink-0">{@render children()}</div>
</div>
