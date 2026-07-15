<script lang="ts">
	import { toastState } from '$lib/core/toast.svelte';
	import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-svelte';

	const iconMap = {
		success: CheckCircle,
		error:   XCircle,
		info:    Info,
		warning: AlertTriangle,
	};

	const colorMap = {
		success: 'bg-primary-50 dark:bg-primary-950/60 border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-300',
		error:   'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
		info:    'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
		warning: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
	};
</script>

<div
	aria-live="polite"
	aria-atomic="false"
	class="fixed bottom-20 right-4 z-50 flex flex-col gap-2 md:bottom-6"
>
	{#each toastState.toasts as toast (toast.id)}
		{@const Icon = iconMap[toast.type]}
		<div
			role="status"
			class="flex min-w-[220px] max-w-xs items-start gap-2.5 rounded-xl border px-3.5 py-2.5 shadow-lg
				   text-sm font-medium animate-in slide-in-from-right-4 fade-in duration-200
				   {colorMap[toast.type]}"
		>
			<Icon size={16} class="mt-0.5 shrink-0" />
			<span class="flex-1 leading-snug">{toast.message}</span>
			<button
				onclick={() => toastState.dismiss(toast.id)}
				aria-label="Meldung schließen"
				class="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
			>
				<X size={14} />
			</button>
		</div>
	{/each}
</div>
