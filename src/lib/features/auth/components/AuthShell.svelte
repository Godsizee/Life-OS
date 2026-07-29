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

<!--
	Gemeinsamer Rahmen für Login, Registrierung und Onboarding: identische
	Ausrichtung, identische Marke, identische Feldbreite. Ohne ihn driften die
	drei Seiten optisch auseinander.
-->
<div class="flex min-h-dvh flex-col justify-center px-4 py-10 pt-safe pb-safe">
	<div class="mx-auto flex w-full max-w-sm flex-col gap-6">
		<div class="flex items-center gap-3">
			<img src="/favicon.svg" alt="" class="h-11 w-11 rounded-2xl elevation-1" />
			<div class="flex min-w-0 flex-col">
				<span class="text-base font-bold tracking-tight text-text-primary">Life OS</span>
				<span class="truncate text-xs text-text-secondary">Dein persönliches Betriebssystem</span>
			</div>
		</div>

		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
			{#if subtitle}
				<p class="text-sm text-text-secondary">{subtitle}</p>
			{/if}
		</div>

		{@render children()}

		{#if footer}
			<div class="flex flex-col items-center gap-2 text-center text-sm text-text-secondary">
				{@render footer()}
			</div>
		{/if}
	</div>
</div>
