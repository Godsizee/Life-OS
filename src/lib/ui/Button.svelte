<script lang="ts">
	import type { Snippet } from 'svelte';
	import Spinner from './Spinner.svelte';

	type Variante = 'primaer' | 'sekundaer' | 'ghost' | 'gefahr';

	let {
		variant = 'primaer',
		size = 'md',
		type = 'button',
		disabled = false,
		loading = false,
		fullWidth = false,
		onclick,
		class: className = '',
		icon,
		children
	}: {
		/** Alt-Namen `primary`, `secondary` und `danger` gelten weiter. */
		variant?: Variante | 'primary' | 'secondary' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		type?: 'button' | 'submit';
		disabled?: boolean;
		/** Sperrt den Button und zeigt einen Spinner – der Text bleibt stehen, damit die Breite nicht springt. */
		loading?: boolean;
		fullWidth?: boolean;
		onclick?: (event: MouseEvent) => void;
		class?: string;
		icon?: Snippet;
		children: Snippet;
	} = $props();

	const ALIAS = { primary: 'primaer', secondary: 'sekundaer', danger: 'gefahr' } as const;
	const art = $derived<Variante>(
		variant in ALIAS ? ALIAS[variant as keyof typeof ALIAS] : (variant as Variante)
	);

	const varianten: Record<Variante, string> = {
		primaer: 'druckbar border-tinte bg-signal text-auf-farbe',
		sekundaer: 'druckbar border-tinte bg-flaeche text-tinte',
		ghost:
			'border-transparent text-inherit underline decoration-2 underline-offset-4 hover:bg-flaeche-2',
		gefahr: 'druckbar border-tinte bg-gefahr text-auf-gefahr'
	};

	// md hält das Touch-Ziel (--ziel-min); sm bleibt für dichte Zeilen, lg für Hauptaktionen.
	const groessen = {
		sm: 'min-h-10 px-3 text-sm',
		md: 'min-h-[var(--ziel-min)] px-4',
		lg: 'min-h-14 px-6 text-lg'
	};
</script>

<button
	{type}
	disabled={disabled || loading}
	{onclick}
	aria-busy={loading}
	class="inline-flex items-center justify-center gap-2 rounded-md border-2 font-semibold disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none {varianten[
		art
	]} {groessen[size]} {fullWidth ? 'w-full' : ''} {className}"
>
	{#if loading}
		<Spinner size={16} />
	{:else if icon}
		{@render icon()}
	{/if}
	{@render children()}
</button>
