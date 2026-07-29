<script lang="ts">
	import { Eye, EyeOff } from 'lucide-svelte';
	import { passwordStrength, STRENGTH_LABELS } from '../schema';

	let {
		value = $bindable(''),
		id = 'password',
		label = 'Passwort',
		autocomplete = 'current-password',
		error = '',
		showStrength = false
	}: {
		value?: string;
		id?: string;
		label?: string;
		autocomplete?: 'current-password' | 'new-password';
		error?: string;
		/** Nur bei der Vergabe eines neuen Passworts sinnvoll. */
		showStrength?: boolean;
	} = $props();

	let visible = $state(false);
	const strength = $derived(passwordStrength(value));

	// Rot → Amber → Grün. Bewusst nicht nur Farbe: der Text daneben trägt
	// dieselbe Information für Nutzer, die Farben nicht unterscheiden.
	const barColors = [
		'bg-red-500',
		'bg-red-500',
		'bg-amber-500',
		'bg-primary-500',
		'bg-green-500'
	];

	// Eigenes <label> statt Field.svelte: der Umschalt-Knopf säße sonst im Label
	// und würde bei jedem Klick zusätzlich das Eingabefeld ansteuern.
</script>

<div class="flex flex-col gap-1.5">
	<label for={id} class="text-sm font-medium text-text-secondary">{label}</label>

	<div class="relative">
		<input
			{id}
			bind:value
			type={visible ? 'text' : 'password'}
			{autocomplete}
			required
			aria-invalid={error ? true : undefined}
			aria-describedby={showStrength ? `${id}-strength` : undefined}
			class="min-h-12 w-full rounded-xl border bg-surface-0 pl-4 pr-14 text-base text-text-primary placeholder:text-text-tertiary transition-colors duration-200 focus:outline-none
				{error ? 'border-red-500 focus:border-red-500' : 'border-border-color focus:border-primary-500'}"
		/>
		<button
			type="button"
			onclick={() => (visible = !visible)}
			aria-label={visible ? 'Passwort verbergen' : 'Passwort anzeigen'}
			aria-pressed={visible}
			class="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-text-tertiary transition-transform hover:text-text-primary active:scale-95"
		>
			{#if visible}
				<EyeOff size={18} />
			{:else}
				<Eye size={18} />
			{/if}
		</button>
	</div>

	{#if error}
		<span class="text-xs text-red-500">{error}</span>
	{:else if showStrength && value}
		<div id="{id}-strength" class="flex items-center gap-2">
			<div class="flex h-1 flex-1 gap-1" aria-hidden="true">
				{#each [1, 2, 3, 4] as step (step)}
					<span
						class="flex-1 rounded-full transition-colors duration-200
							{strength.score >= step ? barColors[strength.score] : 'bg-surface-3'}"
					></span>
				{/each}
			</div>
			<span class="w-16 shrink-0 text-right text-xs text-text-tertiary">{strength.label}</span>
		</div>
		<span class="sr-only" aria-live="polite">
			Passwortstärke: {strength.label} von {STRENGTH_LABELS[4]}
		</span>
	{/if}
</div>
