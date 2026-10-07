<script lang="ts">
	import Card from '#lib/ui/Card.svelte';
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
	<Card shadow class="flex min-h-[220px] flex-col justify-between p-5">
		<div>
			<h3 class="mb-3 flex items-center gap-2 text-sm font-bold tracking-tight text-text-primary">
				{#if Icon}<Icon size={16} />{/if}
				{title}
			</h3>
			{@render children()}
		</div>
		<a {href} class="mt-4 inline-block text-xs font-bold text-primary-active hover:underline"
			>{linkText} →</a
		>
	</Card>
	{#snippet failed(error, reset)}
		<div
			class="premium-shadow flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-surface-0 text-center"
		>
			<p class="text-sm font-bold text-red-600 dark:text-red-400">{title} Fehler</p>
			<button
				onclick={() => {
					reset();
					onReset();
				}}
				class="mt-2 text-xs font-bold text-primary-active underline">Erneut versuchen</button
			>
		</div>
	{/snippet}
</svelte:boundary>
