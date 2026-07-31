<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-svelte';
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

	// Fehler und Warnungen unterbrechen den Screenreader, Hinweise nicht. Vorher
	// trugen alle Meldungen dieselbe Rolle - oder gar keine.
	const roles = { error: 'alert', warning: 'alert', info: 'status', success: 'status' } as const;

	const styles = {
		error:
			'border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300',
		warning:
			'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300',
		info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300',
		success:
			'border-primary-200 bg-primary-50 text-primary-800 dark:border-primary-800/60 dark:bg-primary-950/50 dark:text-primary-300'
	};

	const Icon = $derived(icons[variant]);
</script>

<div
	role={roles[variant]}
	transition:fly={{ y: -6, duration: motionDuration(DURATION.fast), easing: EASE_STANDARD }}
	class="flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm leading-snug {styles[variant]}"
>
	<Icon size={16} class="mt-0.5 shrink-0" />
	<div class="flex min-w-0 flex-1 flex-col gap-1.5">
		{@render children()}
		{#if action}
			{@render action()}
		{/if}
	</div>
</div>
