<script lang="ts">
	let { score = 0, size = 120 }: { score?: number; size?: number } = $props();

	const RADIUS = 40;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

	// Calculate stroke dashoffset
	const strokeOffset = $derived(CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE);

	// Select color theme based on score level
	const colorClass = $derived(
		score >= 80
			? 'stroke-primary-500'
			: score >= 50
				? 'stroke-primary-500 dark:stroke-primary-400'
				: score >= 20
					? 'stroke-amber-500'
					: 'stroke-red-500'
	);
	
	const textClass = $derived(
		score >= 80
			? 'text-primary-600 dark:text-primary-400'
			: score >= 50
				? 'text-primary-active'
				: score >= 20
					? 'text-amber-600 dark:text-amber-400'
					: 'text-red-600 dark:text-red-400'
	);
</script>

<div class="relative flex items-center justify-center" style="width: {size}px; height: {size}px;">
	<svg class="-rotate-90" width={size} height={size} viewBox="0 0 100 100">
		<!-- Background Track -->
		<circle
			cx="50"
			cy="50"
			r={RADIUS}
			fill="none"
			stroke="currentColor"
			stroke-width="8"
			class="text-surface-3"
		/>
		
		<!-- Indicator Ring -->
		<circle
			cx="50"
			cy="50"
			r={RADIUS}
			fill="none"
			stroke-width="8"
			stroke-linecap="round"
			stroke-dasharray={CIRCUMFERENCE}
			stroke-dashoffset={strokeOffset}
			class="transition-all duration-1000 ease-out {colorClass}"
			filter="url(#glow)"
		/>

		<!-- Glow filter definition -->
		<defs>
			<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
				<feGaussianBlur stdDeviation="2" result="blur" />
				<feComposite in="SourceGraphic" in2="blur" operator="over" />
			</filter>
		</defs>
	</svg>
	
	<!-- Score Text overlay -->
	<div class="absolute flex flex-col items-center justify-center">
		<span class="text-3xl font-extrabold tracking-tight tabular-nums {textClass}">{score}</span>
		<span class="text-[9px] uppercase tracking-wider font-semibold text-text-tertiary">Score</span>
	</div>
</div>
