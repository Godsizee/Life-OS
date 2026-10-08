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
		/** sm bleibt optisch kleiner, behält aber eine große Trefferfläche über ein Pseudo-Element. */
		size?: 'sm' | 'md';
		type?: 'button' | 'submit';
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		class?: string;
		children: Snippet;
	} = $props();

	const variants = {
		ghost: 'border-transparent text-tinte hover:bg-flaeche-2',
		surface: 'druckbar border-tinte bg-flaeche text-tinte',
		primary: 'druckbar border-tinte bg-signal text-auf-farbe',
		danger: 'border-transparent text-gefahr hover:bg-flaeche-2'
	};

	const sizes = {
		sm: 'h-9 w-9 after:absolute after:inset-[-6px] after:content-[""]',
		md: 'h-11 w-11'
	};
</script>

<button
	{type}
	{disabled}
	{onclick}
	aria-label={label}
	class="relative flex shrink-0 items-center justify-center rounded-md border-2 disabled:pointer-events-none disabled:opacity-50 {variants[
		variant
	]} {sizes[size]} {className}"
>
	{@render children()}
</button>
