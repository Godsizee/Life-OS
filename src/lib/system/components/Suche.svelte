<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowRight, Search, Zap } from '@lucide/svelte';
	import { modules } from '#lib/config/modules.js';
	import { toastState } from '#lib/core/toast.svelte.js';
	import Modal from '#lib/ui/Modal.svelte';
	import Input from '#lib/ui/Input.svelte';
	import { sammleErgebnisse, type Ergebnis } from '../suche.js';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	let query = $state('');
	let activeIndex = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);

	const suche = $derived(sammleErgebnisse(query));
	const ergebnisse = $derived(suche.ergebnisse);

	// Gruppen für die Anzeige; `index` zählt über alle Gruppen hinweg (Quelle für aria-activedescendant).
	const gruppen = $derived.by(() => {
		const out: { name: string; eintraege: { e: Ergebnis; index: number }[] }[] = [];
		ergebnisse.forEach((e, index) => {
			const letzte = out[out.length - 1];
			if (letzte && letzte.name === e.gruppe) letzte.eintraege.push({ e, index });
			else out.push({ name: e.gruppe, eintraege: [{ e, index }] });
		});
		return out;
	});

	// Neue Ergebnisse: Auswahl zurück an den Anfang.
	$effect(() => {
		ergebnisse;
		activeIndex = 0;
	});

	// Fokus beim Öffnen
	$effect(() => {
		if (open) setTimeout(() => inputEl?.focus(), 10);
	});

	function close() {
		open = false;
		query = '';
		activeIndex = 0;
	}

	async function waehle(e: Ergebnis) {
		close();
		if (e.aktion) {
			try {
				toastState.success(await e.aktion());
			} catch {
				toastState.error('Eingabe fehlgeschlagen');
			}
		} else if (e.href) {
			void goto(e.href);
		}
	}

	function handleKeydown(ev: KeyboardEvent) {
		const n = ergebnisse.length;
		if (ev.key === 'ArrowDown') {
			ev.preventDefault();
			if (n) activeIndex = Math.min(activeIndex + 1, n - 1);
		} else if (ev.key === 'ArrowUp') {
			ev.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
		} else if (ev.key === 'Home' && n) {
			ev.preventDefault();
			activeIndex = 0;
		} else if (ev.key === 'End' && n) {
			ev.preventDefault();
			activeIndex = n - 1;
		} else if (ev.key === 'Enter') {
			ev.preventDefault();
			const e = ergebnisse[activeIndex];
			if (e) void waehle(e);
		}
	}

	// Aktive Option in den sichtbaren Bereich scrollen.
	$effect(() => {
		if (!open) return;
		document.getElementById(`suche-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
	});

	const statusText = $derived(
		suche.modus === 'hilfe'
			? 'Hilfethemen folgen in einer späteren Ausbaustufe.'
			: ergebnisse.length === 0
				? 'Keine Treffer'
				: `${ergebnisse.length} Ergebnis${ergebnisse.length === 1 ? '' : 'se'}`
	);
	const moduleMeta = (id?: string) => modules.find((m) => m.id === id);
</script>

<Modal bind:open label="Suche">
	<div class="flex items-center gap-3 border-b border-border-color px-4 py-3">
		<Search size={18} class="shrink-0 text-text-secondary" aria-hidden="true" />
		<Input
			bind:element={inputEl}
			bind:value={query}
			onkeydown={handleKeydown}
			type="text"
			role="combobox"
			aria-label="Suchen oder Aktion eingeben"
			aria-expanded={ergebnisse.length > 0}
			aria-controls="suche-liste"
			aria-autocomplete="list"
			aria-activedescendant={ergebnisse.length ? `suche-${activeIndex}` : undefined}
			placeholder="Suchen oder Aktion eingeben…  (> Befehle, ? Hilfe)"
			autocomplete="off"
			class="min-h-11 border-0 bg-transparent px-0"
		/>
		<kbd
			class="hidden shrink-0 rounded border border-border-color/30 bg-surface-2 px-1.5 py-0.5 text-[10px] text-text-tertiary sm:block"
			>Esc</kbd
		>
	</div>

	<p class="sr-only" role="status" aria-live="polite">{statusText}</p>

	<div
		id="suche-liste"
		role="listbox"
		aria-label="Ergebnisse"
		class="max-h-72 overflow-y-auto py-2"
	>
		{#each gruppen as gruppe, g (gruppe.name)}
			<div role="group" aria-labelledby="suche-gruppe-{g}">
				<div
					id="suche-gruppe-{g}"
					class="px-4 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-text-tertiary uppercase"
				>
					{gruppe.name}
				</div>
				{#each gruppe.eintraege as { e, index } (e.id)}
					{@const meta = moduleMeta(e.modul)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						id="suche-{index}"
						role="option"
						tabindex="-1"
						aria-selected={index === activeIndex}
						onclick={() => waehle(e)}
						onmouseenter={() => (activeIndex = index)}
						class="flex min-h-12 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-colors
							{index === activeIndex ? 'bg-surface-2' : ''}"
					>
						<span class="flex w-5 shrink-0 justify-center text-text-secondary" aria-hidden="true">
							{#if e.art === 'ausfuehren'}
								<Zap size={16} />
							{:else if meta}
								<meta.icon size={16} />
							{:else}
								<ArrowRight size={16} />
							{/if}
						</span>
						<span class="min-w-0 flex-1">
							<span class="block truncate text-sm text-text-primary">{e.label}</span>
							{#if e.sub}
								<span class="block truncate text-xs text-text-tertiary">{e.sub}</span>
							{/if}
						</span>
					</div>
				{/each}
			</div>
		{:else}
			<div class="px-4 py-3 text-sm text-text-tertiary" role="presentation">{statusText}</div>
		{/each}
	</div>

	<div
		class="flex items-center gap-3 border-t border-border-color px-4 py-2 text-[10px] text-text-tertiary"
		aria-hidden="true"
	>
		<span
			><kbd class="rounded border border-border-color/30 bg-surface-2 px-1 py-0.5 font-mono">↑↓</kbd
			> navigieren</span
		>
		<span
			><kbd class="rounded border border-border-color/30 bg-surface-2 px-1 py-0.5 font-mono">↵</kbd> auswählen</span
		>
		<span
			><kbd class="rounded border border-border-color/30 bg-surface-2 px-1 py-0.5 font-mono"
				>Esc</kbd
			> schließen</span
		>
	</div>
</Modal>
