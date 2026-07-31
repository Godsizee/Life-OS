<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle,
		children,
		footer
	}: {
		title: string;
		subtitle?: string;
		children: Snippet;
		footer?: Snippet;
	} = $props();
</script>

<div class="flex min-h-dvh flex-col justify-center px-4 py-10 pt-safe pb-safe">
	<div class="mx-auto flex w-full max-w-sm flex-col gap-6">
		<div class="auth-enter flex items-center gap-3" style="--stagger: 0ms">
			<img src="/favicon.svg" alt="" class="h-11 w-11 rounded-2xl elevation-1" />
			<div class="flex min-w-0 flex-col">
				<span class="text-base font-bold tracking-tight text-text-primary">Life OS</span>
				<span class="truncate text-xs text-text-secondary">Dein persönliches Betriebssystem</span>
			</div>
		</div>

		<div class="auth-enter flex flex-col gap-1" style="--stagger: 60ms">
			<h1 class="text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
			{#if subtitle}
				<p class="text-sm text-text-secondary">{subtitle}</p>
			{/if}
		</div>

		<div class="auth-enter flex flex-col gap-6" style="--stagger: 120ms">
			{@render children()}
		</div>

		{#if footer}
			<div
				class="auth-enter flex flex-col items-center gap-2 text-center text-sm text-text-secondary"
				style="--stagger: 180ms"
			>
				{@render footer()}
			</div>
		{/if}
	</div>
</div>
