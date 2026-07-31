<script lang="ts">
	import Card from '$lib/ui/Card.svelte';
	import type { Snippet } from 'svelte';

	let {
		title,
		linkText,
		href,
		icon: Icon,
		children,
		onReset
	}: {
		title: string;
		linkText: string;
		href: string;
		icon?: any;
		children: Snippet;
		onReset: () => void;
	} = $props();
</script>

<svelte:boundary onerror={(err) => console.error(`Error in ${title} card:`, err)}>
	<Card shadow class="p-5 flex flex-col justify-between min-h-[220px]">
		<div>
			<h3 class="font-bold text-text-primary text-sm tracking-tight mb-3 flex items-center gap-2">
				{#if Icon}<Icon size={16} />{/if}
				{title}
			</h3>
			{@render children()}
		</div>
		<a {href} class="mt-4 text-xs font-bold text-primary-active hover:underline inline-block">{linkText} →</a>
	</Card>
	{#snippet failed(error, reset)}
		<div class="bg-surface-0 rounded-2xl border border-red-500/20 premium-shadow text-center flex flex-col justify-center items-center min-h-[220px]">
			<p class="text-sm font-bold text-red-600 dark:text-red-400">{title} Fehler</p>
			<button onclick={() => { reset(); onReset(); }} class="mt-2 text-xs font-bold text-primary-active underline">Erneut versuchen</button>
		</div>
	{/snippet}
</svelte:boundary>
