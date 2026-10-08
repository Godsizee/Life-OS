<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { AlertTriangle, CheckCircle, Info, XCircle } from '@lucide/svelte';
	import { DURATION, EASE_STANDARD, motionDuration } from './motion';

	let {
		variant = 'error',
		action,
		children
	}: {
		variant?: 'error' | 'info' | 'success' | 'warning';
		/** Ausweg statt Sackgasse — z. B. ein "Jetzt anmelden"-Link unter dem Text. */
		action?: Snippet;
		children: Snippet;
	} = $props();

	const icons = { error: XCircle, warning: AlertTriangle, info: Info, success: CheckCircle };

	// Fehler und Warnungen unterbrechen den Screenreader, Hinweise nicht.
	const roles = { error: 'alert', warning: 'alert', info: 'status', success: 'status' } as const;

	// Das Kopfband trägt Farbe, Symbol und ein Wort: Die Art steht nie nur in der Farbe.
	const baender = {
		error: { text: 'Fehler', klasse: 'bg-gefahr text-auf-gefahr' },
		warning: { text: 'Achtung', klasse: 'bg-mod-shopping text-auf-farbe' },
		info: { text: 'Hinweis', klasse: 'bg-info text-auf-info' },
		success: { text: 'Erledigt', klasse: 'bg-erfolg text-auf-erfolg' }
	};

	const Icon = $derived(icons[variant]);
	const band = $derived(baender[variant]);
</script>

<div
	role={roles[variant]}
	transition:fly={{ y: -6, duration: motionDuration(DURATION.fast), easing: EASE_STANDARD }}
	class="box text-sm leading-snug"
>
	<div
		class="mono-label flex items-center gap-2 rounded-t-[calc(var(--kante-l)-var(--rahmen))] border-b-[length:var(--rahmen-s)] border-tinte px-3 py-1.5 {band.klasse}"
	>
		<Icon size={16} class="shrink-0" />
		{band.text}
	</div>
	<div class="flex min-w-0 flex-col gap-1.5 px-3 py-2.5 text-tinte">
		{@render children()}
		{#if action}
			{@render action()}
		{/if}
	</div>
</div>
