<script lang="ts">
	import { Plus } from '@lucide/svelte';
	import { analyticsState } from '#lib/features/analytics/store.svelte.js';
	import { toastState } from '#lib/core/toast.svelte.js';
	// Entfällt mit der neuen „Heute“-Seite (T402); bis dahin teilt sie sich die Deutung mit dem Erfassen-Blatt.
	import { ErfassenSitzung } from '#lib/system/erfassen-sitzung.svelte.js';
	import ErfassenDeutung from '#lib/system/components/ErfassenDeutung.svelte';

	const sitzung = new ErfassenSitzung();

	async function submitQuickAdd(e: SubmitEvent) {
		e.preventDefault();
		if (!sitzung.aktuell) return;
		try {
			const meldung = await sitzung.ausfuehren();
			if (meldung) toastState.success(meldung);
			await analyticsState.saveTodayScore();
		} catch (err) {
			console.error(err);
			toastState.error('Konnte nicht gespeichert werden.');
		}
	}
</script>

<form onsubmit={submitQuickAdd} class="relative space-y-2">
	<div class="relative flex items-center">
		<input
			id="quick-add-input"
			bind:value={sitzung.text}
			placeholder="Schnelleingabe… (z.B. 3x Eier, Morgen 10:00 Meeting, 75kg, Laufen) (Taste n)"
			class="premium-shadow min-h-12 w-full rounded-2xl border border-border-color bg-surface-0 pr-12 pl-4 text-base text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
		/>
		<button
			type="submit"
			aria-label={sitzung.aktuell ? `Als ${sitzung.aktuell.art.label} anlegen` : 'Hinzufügen'}
			class="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700 text-white transition-all hover:bg-primary-800 active:scale-95 dark:bg-primary-600 dark:hover:bg-primary-700"
		>
			<Plus size={18} />
		</button>
	</div>

	<div class="px-1">
		<ErfassenDeutung {sitzung} />
	</div>
</form>
