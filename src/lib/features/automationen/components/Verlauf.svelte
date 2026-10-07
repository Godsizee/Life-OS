<script lang="ts">
	import { formatDate } from '#lib/core/date.js';
	import EmptyState from '#lib/ui/EmptyState.svelte';
	import { automationen } from '../laufzeit.svelte.js';
	import type { ProtokollEintrag } from '../types.js';

	const STATUS: Record<ProtokollEintrag['status'], { label: string; klasse: string }> = {
		ausgefuehrt: {
			label: 'Ausgeführt',
			klasse: 'bg-primary-50 text-primary-800 dark:bg-primary-950/50 dark:text-primary-300'
		},
		vorgeschlagen: {
			label: 'Vorgeschlagen',
			klasse: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
		},
		abgelehnt: { label: 'Abgelehnt', klasse: 'bg-surface-2 text-text-secondary' },
		rueckgaengig: {
			label: 'Rückgängig',
			klasse: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
		},
		'ohne-wirkung': { label: 'Ohne Wirkung', klasse: 'bg-surface-2 text-text-secondary' },
		fehler: {
			label: 'Fehler',
			klasse: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
		}
	};

	const zeitFormat: Intl.DateTimeFormatOptions = {
		weekday: 'short',
		day: '2-digit',
		month: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	};
</script>

{#if automationen.protokoll.length === 0}
	<EmptyState
		title="Noch nichts passiert"
		hint="Sobald eine Verknüpfung etwas tut, steht es hier. Der Verlauf gilt für dieses Gerät und wird beim Abmelden gelöscht."
	/>
{:else}
	{#if automationen.fehlerAnzahl > 0}
		<p class="mb-3 text-xs text-red-700 dark:text-red-300">
			{automationen.fehlerAnzahl} Fehler. Sie werden hier gesammelt und nicht als Meldung angezeigt.
		</p>
	{/if}
	<ul class="flex flex-col gap-2 pb-8">
		{#each automationen.protokoll as e (e.id)}
			<li class="rounded-xl border border-border-color bg-surface-0 p-3 shadow-sm">
				<div class="flex items-start justify-between gap-3">
					<p class="min-w-0 text-sm font-medium text-text-primary">{e.beschreibung}</p>
					<span
						class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold {STATUS[e.status]
							.klasse}"
					>
						{STATUS[e.status].label}
					</span>
				</div>
				<p class="mt-1 text-xs text-text-tertiary">
					<a href="/settings/automationen#{e.regelId}" class="underline underline-offset-2">
						{e.regelTitel}
					</a>
					· {formatDate(e.zeit, zeitFormat)}
				</p>
				{#if e.fehler}
					<p class="mt-1 text-xs text-red-700 dark:text-red-300">{e.fehler}</p>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
