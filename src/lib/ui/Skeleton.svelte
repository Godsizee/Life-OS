<script lang="ts">
	let {
		shape = 'rect',
		width = '100%',
		height = '1rem',
		radius = '0.5rem',
		className = ''
	}: {
		shape?: 'rect' | 'circle';
		width?: string;
		height?: string;
		radius?: string;
		className?: string;
	} = $props();
</script>

<div
	class="animate-pulse bg-surface-3/60 dark:bg-surface-3/30 {className}"
	style:width={width}
	style:height={height}
	style:border-radius={shape === 'circle' ? '50%' : radius}
></div>
