<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		type = 'button',
		disabled = false,
		onclick,
		children
	}: {
		variant?: 'primary' | 'secondary' | 'ghost';
		type?: 'button' | 'submit';
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	} = $props();

	const variants = {
		primary: 'bg-emerald-600 text-white active:bg-emerald-700',
		secondary: 'bg-slate-100 text-slate-900 active:bg-slate-200',
		ghost: 'text-slate-500 active:bg-slate-100'
	};
</script>

<button
	{type}
	{disabled}
	{onclick}
	class="min-h-12 rounded-xl px-4 font-medium transition-transform active:scale-95 disabled:opacity-50 {variants[
		variant
	]}"
>
	{@render children()}
</button>
