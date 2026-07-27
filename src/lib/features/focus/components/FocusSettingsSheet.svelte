<script lang="ts">
	// W6 — Fokus-Dauern. Bewusst hier statt in /more: vier Werte würden die
	// Einstellungsliste dominieren, und gebraucht werden sie genau auf dieser Seite.
	import Sheet from '$lib/ui/Sheet.svelte';
	import Field from '$lib/ui/Field.svelte';
	import StepperInput from '$lib/features/fitness/components/StepperInput.svelte';
	import { FOCUS_LIMITS, profileState } from '$lib/features/profile/store.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	// Lokale Kopien, damit der Stepper frei editierbar bleibt; geschrieben wird onblur.
	let focusMin = $state<number | null>(null);
	let breakMin = $state<number | null>(null);
	let longBreakMin = $state<number | null>(null);
	let rounds = $state<number | null>(null);

	$effect(() => {
		if (!open) return;
		focusMin = profileState.focusMinutes;
		breakMin = profileState.focusBreakMinutes;
		longBreakMin = profileState.focusLongBreakMinutes;
		rounds = profileState.focusRoundsUntilLongBreak;
	});

	function commit(key: keyof typeof FOCUS_LIMITS, value: number | null) {
		if (value === null || !Number.isFinite(value)) return;
		void profileState.setFocusSetting(key, value);
	}
</script>

<Sheet bind:open title="Fokus-Einstellungen">
	<div class="flex flex-col gap-4 px-4 pb-6">
		<Field label="Fokusdauer" hint="Länge einer Runde">
			<StepperInput
				bind:value={focusMin}
				step={FOCUS_LIMITS.focus_minutes.step}
				min={FOCUS_LIMITS.focus_minutes.min}
				unit="min"
				label="Fokusdauer"
			/>
		</Field>

		<Field label="Kurze Pause">
			<StepperInput
				bind:value={breakMin}
				step={FOCUS_LIMITS.focus_break_minutes.step}
				min={FOCUS_LIMITS.focus_break_minutes.min}
				unit="min"
				label="Kurze Pause"
			/>
		</Field>

		<Field label="Lange Pause">
			<StepperInput
				bind:value={longBreakMin}
				step={FOCUS_LIMITS.focus_long_break_minutes.step}
				min={FOCUS_LIMITS.focus_long_break_minutes.min}
				unit="min"
				label="Lange Pause"
			/>
		</Field>

		<Field label="Runden bis zur langen Pause" hint="Tagessoll für den Life Score: {(focusMin ?? 0) * (rounds ?? 0)} min">
			<StepperInput
				bind:value={rounds}
				step={FOCUS_LIMITS.focus_rounds_until_long_break.step}
				min={FOCUS_LIMITS.focus_rounds_until_long_break.min}
				unit="×"
				label="Runden bis zur langen Pause"
			/>
		</Field>

		<p class="text-xs text-text-tertiary">
			Änderungen greifen ab der nächsten Phase — eine laufende Runde behält ihre Dauer.
		</p>

		<button
			onclick={() => {
				commit('focus_minutes', focusMin);
				commit('focus_break_minutes', breakMin);
				commit('focus_long_break_minutes', longBreakMin);
				commit('focus_rounds_until_long_break', rounds);
				open = false;
			}}
			class="min-h-12 rounded-xl bg-primary-700 font-medium text-white active:scale-95 dark:bg-primary-600"
		>
			Speichern
		</button>
	</div>
</Sheet>
