<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconKomponente } from '#lib/ui/icon.js';
	import Anleitung from './Anleitung.svelte';

	/** Alt-Name von `Anleitung` (title → titel, hint → was, action → ersterSchritt). */
	let {
		icon,
		title,
		hint,
		action,
		size = 'base'
	}: {
		icon?: IconKomponente;
		title: string;
		hint?: string;
		action?: Snippet;
		/** 'sm' für Dashboard-Kacheln, 'base' für ganze Seiten. */
		size?: 'sm' | 'base';
	} = $props();
</script>

<Anleitung {icon} titel={title} was={hint} ersterSchritt={action} {size} />
