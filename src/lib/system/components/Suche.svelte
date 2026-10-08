<script lang="ts">
	import { istOffen } from '#lib/features/tasks/status.js';
	import { goto } from '$app/navigation';
	import Modal from '#lib/ui/Modal.svelte';
	import { tasksState } from '#lib/features/tasks/store.svelte.js';
	import { notesState } from '#lib/features/notes/store.svelte.js';
	import { calendarState } from '#lib/features/calendar/store.svelte.js';
	import { goalsState } from '#lib/features/goals/store.svelte.js';
	import { habitsState } from '#lib/features/habits/store.svelte.js';
	import { aktiveModule, istAktiv } from '../module-aktiv.svelte.js';
	import { deute } from '../erfassen.js';
	import { toastState } from '#lib/core/toast.svelte.js';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	let query = $state('');
	let activeIndex = $state(0);
	let inputEl = $state<HTMLInputElement | undefined>(undefined);

	// ── Schnell-Aktionen ──────────────────────────────────────────────
	const quickActions = [
		{
			type: 'action' as const,
			label: 'Fokus-Modus starten',
			modul: 'focus' as const,
			icon: '⚡',
			action: () => goto('/focus')
		},
		{
			type: 'action' as const,
			label: 'Weekly Review',
			modul: 'review' as const,
			icon: '📋',
			action: () => goto('/review')
		},
		{
			type: 'action' as const,
			label: 'Neue Aufgabe',
			modul: 'tasks' as const,
			icon: '✓',
			action: () => goto('/tasks')
		},
		{
			type: 'action' as const,
			label: 'Neue Notiz',
			modul: 'notes' as const,
			icon: '📝',
			action: () => goto('/notes')
		}
	];

	// ── Erfassen: dieselbe Deutung wie im Erfassen-Blatt ──────────────
	const deutung = $derived(query.trim() ? (deute(query.trim())[0] ?? null) : null);

	async function runNLP() {
		const d = deutung;
		if (!d) return;
		try {
			toastState.success(await d.art.ausfuehren(d.vorschau));
		} catch {
			toastState.error('Eingabe fehlgeschlagen');
		}
	}

	// ── Fuzzy-Suche ───────────────────────────────────────────────────
	function fuzzy(text: string, q: string): boolean {
		if (!q) return true;
		const lower = text.toLowerCase();
		const ql = q.toLowerCase();
		let qi = 0;
		for (let i = 0; i < lower.length && qi < ql.length; i++) {
			if (lower[i] === ql[qi]) qi++;
		}
		return qi === ql.length;
	}

	interface Result {
		type: 'action' | 'task' | 'note' | 'nav' | 'event' | 'goal' | 'habit';
		label: string;
		icon: string;
		sub?: string;
		action: () => void;
	}

	const results = $derived.by((): Result[] => {
		const q = query.trim();
		const out: Result[] = [];

		// NLP-Aktion zuerst (bei nicht-leerer Eingabe)
		if (deutung) {
			out.push({
				type: 'action',
				label: `Ausführen: „${query.trim()}"`,
				icon: '⚡',
				sub: `Erkannt: ${deutung.vorschau.art}`,
				action: () => runNLP()
			});
		}

		// Module-Navigation (immer sichtbar bei leerem Query oder Treffer)
		for (const m of aktiveModule.meta) {
			if (fuzzy(m.label, q)) {
				out.push({ type: 'nav', label: m.label, icon: '→', action: () => goto(m.route) });
			}
		}

		// Schnell-Aktionen
		for (const a of quickActions) {
			if (a.modul && !istAktiv(a.modul)) continue;
			if (fuzzy(a.label, q)) {
				out.push({ ...a });
			}
		}

		// Tasks
		for (const t of istAktiv('tasks') ? tasksState.tasks.filter(istOffen) : []) {
			if (fuzzy(t.title, q)) {
				out.push({
					type: 'task',
					label: t.title,
					icon: '○',
					sub: t.priority === 'high' ? '! Hohe Priorität' : undefined,
					action: () => goto('/tasks')
				});
			}
		}

		// Notizen
		for (const n of istAktiv('notes') ? notesState.notes : []) {
			if (fuzzy(n.title, q)) {
				out.push({
					type: 'note',
					label: n.title,
					icon: n.private ? '🔒' : '📝',
					action: () => goto(`/notes?note=${n.id}`)
				});
			}
		}

		// Termine
		for (const e of istAktiv('calendar') ? calendarState.events : []) {
			if (fuzzy(e.title, q)) {
				out.push({ type: 'event', label: e.title, icon: '📅', action: () => goto('/calendar') });
			}
		}

		// Ziele
		for (const g of istAktiv('goals') ? goalsState.goals : []) {
			if (fuzzy(g.title, q)) {
				out.push({
					type: 'goal',
					label: g.title,
					icon: '🎯',
					action: () => goto(`/goals/${g.id}`)
				});
			}
		}

		// Routinen
		for (const h of istAktiv('habits') ? habitsState.habits.filter((h) => !h.archived) : []) {
			if (fuzzy(h.name, q)) {
				out.push({ type: 'habit', label: h.name, icon: '🔁', action: () => goto('/habits') });
			}
		}

		return out.slice(0, 8);
	});

	// Reset index wenn sich Ergebnisse ändern
	$effect(() => {
		results; // trigger tracking
		activeIndex = 0;
	});

	function close() {
		open = false;
		query = '';
		activeIndex = 0;
	}

	function selectCurrent() {
		const r = results;
		if (r[activeIndex]) {
			r[activeIndex].action();
			close();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		const r = results;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = Math.min(activeIndex + 1, r.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			selectCurrent();
		} else if (e.key === 'Escape') {
			close();
		}
	}

	// Fokus beim Öffnen
	$effect(() => {
		if (open) {
			// Kleines Delay für DOM-Update
			setTimeout(() => inputEl?.focus(), 10);
		}
	});

	const typeColor: Record<string, string> = {
		action: 'text-accent-600 dark:text-accent-400',
		task: 'text-blue-600 dark:text-blue-400',
		note: 'text-amber-600 dark:text-amber-400',
		event: 'text-purple-600 dark:text-purple-400',
		goal: 'text-indigo-600 dark:text-indigo-400',
		habit: 'text-pink-600 dark:text-pink-400',
		nav: 'text-text-secondary'
	};
</script>

<Modal bind:open label="Command Palette">
	<!-- Suchfeld -->
	<div class="flex items-center gap-3 border-b border-border-color px-4 py-3">
		<span class="text-text-secondary">🔍</span>
		<input
			bind:this={inputEl}
			bind:value={query}
			onkeydown={handleKeydown}
			type="text"
			placeholder="Suchen oder Aktion eingeben…"
			class="flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary focus:outline-none"
			autocomplete="off"
		/>
		<kbd
			class="rounded border border-border-color/30 bg-surface-2 px-1.5 py-0.5 text-[10px] text-text-tertiary"
			>Esc</kbd
		>
	</div>

	<!-- Ergebnisse -->
	<ul class="max-h-72 overflow-y-auto py-2" role="listbox">
		{#each results as result, i (i)}
			<li role="option" aria-selected={i === activeIndex}>
				<button
					onclick={() => {
						result.action();
						close();
					}}
					onmouseenter={() => (activeIndex = i)}
					class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors
							{i === activeIndex ? 'bg-surface-2' : ''}"
				>
					<span class="w-5 text-center text-base {typeColor[result.type]}">{result.icon}</span>
					<span class="min-w-0 flex-1">
						<span class="block truncate text-sm text-text-primary">{result.label}</span>
						{#if result.sub}
							<span class="text-xs text-text-tertiary">{result.sub}</span>
						{/if}
					</span>
				</button>
			</li>
		{:else}
			<li class="px-4 py-3 text-sm text-text-tertiary">Keine Treffer</li>
		{/each}
	</ul>

	<!-- Footer -->
	<div
		class="flex items-center gap-3 border-t border-border-color px-4 py-2 text-[10px] text-text-tertiary"
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
