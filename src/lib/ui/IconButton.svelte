<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		variant = 'ghost',
		size = 'md',
		type = 'button',
		disabled = false,
		onclick,
		class: className = '',
		children
	}: {
		/** Pflicht: Icon-Buttons haben keinen sichtbaren Text, brauchen also aria-label. */
		label: string;
		variant?: 'ghost' | 'surface' | 'primary' | 'danger';
		/** sm bleibt optisch kleiner, behält aber 44px Trefferfläche über ein Pseudo-Element. */
		size?: 'sm' | 'md';
		type?: 'button' | 'submit';
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		class?: string;
		children: Snippet;
	} = $props();

	const variants = {
		ghost: 'text-text-tertiary hover:bg-surface-2 hover:text-text-primary',
		surface: 'bg-surface-2 text-text-primary hover:bg-surface-3',
		primary: 'bg-primary-700 text-white hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700',
		danger: 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
	};

	const sizes = {
		sm: 'h-9 w-9 after:absolute after:inset-[-4px] after:content-[""]',
		md: 'h-11 w-11'
	};
</script>

<button
	{type}
	{disabled}
	{onclick}
	aria-label={label}
	class="relative flex shrink-0 items-center justify-center rounded-xl transition-transform active:scale-95 disabled:opacity-50 {variants[
		variant
	]} {sizes[size]} {className}"
>
	{@render children()}
</button>
