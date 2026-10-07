import type { Component } from 'svelte';
/** Typ für Icon-Komponenten von @lucide/svelte — ersetzt `typeof Icon` aus lucide-svelte. */
export type IconKomponente = Component<{
	size?: number | string;
	strokeWidth?: number | string;
	class?: string;
}>;
