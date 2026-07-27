<script lang="ts">
	// W6 — Timer-Ring. Dumme Komponente: bekommt Fortschritt (0..1) und Text.
	let {
		progress,
		clock,
		caption = '',
		accent = 'focus',
		size = 176
	}: {
		progress: number;
		clock: string;
		caption?: string;
		accent?: 'focus' | 'break';
		size?: number;
	} = $props();

	const RADIUS = 54;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
	// progress 0 -> voller Ring, 1 -> leer (läuft ab wie eine Sanduhr).
	const offset = $derived(CIRCUMFERENCE * Math.min(1, Math.max(0, progress)));
	const stroke = $derived(accent === 'break' ? '#3b82f6' : '#4F46E5');
</script>

<div class="relative flex items-center justify-center" style="width: {size}px; height: {size}px;">
	<svg class="-rotate-90" width={size} height={size} viewBox="0 0 144 144" aria-hidden="true">
		<circle cx="72" cy="72" r={RADIUS} fill="none" stroke="var(--border-color)" stroke-width="8" />
		<circle
			cx="72"
			cy="72"
			r={RADIUS}
			fill="none"
			{stroke}
			stroke-width="8"
			stroke-linecap="round"
			stroke-dasharray={CIRCUMFERENCE}
			stroke-dashoffset={offset}
			class="transition-[stroke-dashoffset] duration-1000 ease-linear"
		/>
	</svg>
	<div class="absolute flex flex-col items-center">
		<span class="text-4xl font-bold tabular-nums text-text-primary">{clock}</span>
		{#if caption}
			<span class="mt-0.5 text-xs text-text-tertiary">{caption}</span>
		{/if}
	</div>
</div>
