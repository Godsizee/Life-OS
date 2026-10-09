<script lang="ts">
	import { modules } from '#lib/config/modules.js';
	import { formatUhr } from '#lib/core/date.js';
	import type { AgendaEintrag } from '#lib/core/modul.js';
	import { habitsState } from '#lib/features/habits/store.svelte.js';
	import { tasksState } from '#lib/features/tasks/store.svelte.js';
	import Haken from '#lib/ui/Haken.svelte';
	import StatusBadge from '#lib/ui/StatusBadge.svelte';
	import { idAusKey } from '../../heute-logik.js';

	let { eintraege }: { eintraege: AgendaEintrag[] } = $props();

	const modulMeta = (e: AgendaEintrag) => modules.find((m) => m.id === e.modul);

	function zeitText(e: AgendaEintrag): string | null {
		if (e.ganztags) return 'Ganztägig';
		if (!e.start) return null;
		return e.ende ? `${formatUhr(e.start)}–${formatUhr(e.ende)}` : formatUhr(e.start);
	}

	/** Abhaken geht bei Aufgaben und Routinen direkt in der Zeile; Termine und Erinnerungen haben nichts abzuhaken. */
	const kannAbhaken = (e: AgendaEintrag) => e.art === 'aufgabe' || e.art === 'routine';

	async function schalte(e: AgendaEintrag) {
		const aufgabe = idAusKey(e.key, 'tasks');
		const routine = idAusKey(e.key, 'habits');
		if (aufgabe) await tasksState.setStatus(aufgabe, e.erledigt ? 'todo' : 'done');
		else if (routine) await habitsState.toggleToday(routine);
	}
</script>

<ul class="m-0 list-none p-0">
	{#each eintraege as e (e.key)}
		{@const meta = modulMeta(e)}
		<li class="flex items-stretch border-b-[length:var(--rahmen-s)] border-tinte last:border-b-0">
			<span
				class="w-2 shrink-0"
				style:background-color={meta ? `var(${meta.farbe})` : 'var(--tinte)'}
				aria-hidden="true"
			></span>
			<div class="flex min-w-0 flex-1 items-center gap-1 py-1 pr-2 pl-1">
				{#if kannAbhaken(e)}
					<Haken checked={e.erledigt} modul={e.modul} label={e.titel} ontoggle={() => schalte(e)} />
				{:else}
					<span class="w-3 shrink-0"></span>
				{/if}
				<div class="min-w-0 flex-1 py-1">
					<div class="flex items-baseline gap-2">
						{#if zeitText(e)}
							<span class="mono-label shrink-0 tabular-nums">{zeitText(e)}</span>
						{/if}
						<a
							href={e.href}
							class="min-w-0 truncate font-semibold hover:underline {e.erledigt
								? 'text-text-2 line-through'
								: ''}"
						>
							{e.titel}{#if e.dauerMin && e.art === 'aufgabe'}<span
									class="ml-1 font-normal text-text-2">({e.dauerMin} min)</span
								>{/if}
						</a>
					</div>
					<p class="mono-label truncate text-text-3">{meta?.label ?? ''} · {e.warum}</p>
				</div>
				{#if e.erledigt}
					<StatusBadge status="erledigt" class="shrink-0" />
				{/if}
			</div>
		</li>
	{/each}
</ul>
