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

<div class="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-2 py-2">
	<!-- Passt die Steuerung nicht neben das Label (320 px), rutscht sie darunter, statt es zu verdecken. -->
	<div class="min-w-32 flex-1">
		<p class="text-sm font-semibold text-tinte">{label}</p>
		{#if hint}
			<p class="mt-0.5 text-xs text-text-2">{hint}</p>
		{/if}
	</div>
	<div class="shrink-0">{@render children()}</div>
</div>
