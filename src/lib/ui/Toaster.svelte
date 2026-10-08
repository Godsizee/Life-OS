<script lang="ts">
	import { toastState } from '#lib/core/toast.svelte.js';
	import { CheckCircle, XCircle, Info, AlertTriangle, X } from '@lucide/svelte';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import { DURATION, EASE_STANDARD, motionDuration } from './motion';

	const iconMap = {
		success: CheckCircle,
		error: XCircle,
		info: Info,
		warning: AlertTriangle
	};

	// Fehler bekommen ein Kopfband in Gefahr-Farbe (mit Wort), die übrigen nur das Symbol.
	const aktion =
		'mono-label min-h-8 shrink-0 rounded-sm px-2 underline decoration-2 underline-offset-4 hover:bg-flaeche-2';
</script>

<div
	aria-live="polite"
	aria-atomic="false"
	class="fixed right-4 bottom-20 z-50 flex flex-col gap-3 md:bottom-6"
>
	{#each toastState.toasts as toast (toast.id)}
		{@const Icon = iconMap[toast.type]}
		<div
			role={toast.type === 'error' ? 'alert' : 'status'}
			transition:fly={{ x: 24, duration: motionDuration(DURATION.base), easing: EASE_STANDARD }}
			animate:flip={{ duration: motionDuration(DURATION.fast) }}
			class="box max-w-xs min-w-[220px] bg-flaeche text-sm font-medium"
			style="box-shadow: var(--schatten-s)"
		>
			{#if toast.type === 'error'}
				<div
					class="mono-label flex items-center gap-2 rounded-t-[calc(var(--kante-l)-var(--rahmen))] border-b-[length:var(--rahmen-s)] border-tinte bg-gefahr px-3 py-1 text-auf-gefahr"
				>
					<XCircle size={14} /> Fehler
				</div>
			{/if}
			<div class="flex items-start gap-2.5 px-3 py-2.5">
				{#if toast.type !== 'error'}<Icon size={16} class="mt-0.5 shrink-0" />{/if}
				<span class="flex-1 leading-snug">
					{toast.message}
					{#if toast.count > 1}
						<span class="nums-tabular mono-label ml-1 rounded-sm bg-flaeche-2 px-1.5 py-0.5">
							{toast.count}×
						</span>
					{/if}
				</span>
				<button
					onclick={() => toastState.dismiss(toast.id)}
					aria-label="Meldung schließen"
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm hover:bg-flaeche-2"
				>
					<X size={14} />
				</button>
			</div>
			{#if toast.action || toast.zweiteAktion}
				<div class="flex flex-wrap gap-1 px-2 pb-2">
					{#if toast.action}
						<button
							onclick={() => {
								toast.action?.run();
								toastState.dismiss(toast.id);
							}}
							class={aktion}
						>
							{toast.action.label}
						</button>
					{/if}
					{#if toast.zweiteAktion}
						<button
							onclick={() => {
								toast.zweiteAktion?.run();
								toastState.dismiss(toast.id);
							}}
							class={aktion}
						>
							{toast.zweiteAktion.label}
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/each}
</div>
