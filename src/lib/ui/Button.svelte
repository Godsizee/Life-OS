<script lang="ts">
	import type { Snippet } from 'svelte';
	import Spinner from './Spinner.svelte';

	let {
		variant = 'primary',
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
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
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

	const variants = {
		primary: 'bg-primary-700 hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 text-white',
		secondary: 'bg-surface-2 text-text-primary active:bg-surface-3 border border-border-color',
		ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-2 active:bg-surface-3',
		danger: 'bg-red-500 hover:bg-red-600 text-white'
	};

	// md entspricht exakt dem bisherigen Standard (min-h-12 px-4), damit
	// bestehende Aufrufstellen ohne size-Angabe unverändert aussehen.
	const sizes = {
		sm: 'min-h-10 px-3 text-sm',
		md: 'min-h-12 px-4',
		lg: 'min-h-14 px-6 text-lg'
	};
</script>

<button
	{type}
	disabled={disabled || loading}
	{onclick}
	aria-busy={loading}
	class="inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-transform active:scale-95 disabled:opacity-50 {variants[
		variant
	]} {sizes[size]} {fullWidth ? 'w-full' : ''} {className}"
>
	{#if loading}
		<Spinner size={16} />
	{:else if icon}
		{@render icon()}
	{/if}
	{@render children()}
</button>
