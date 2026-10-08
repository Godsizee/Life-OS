<script lang="ts">
	let {
		shape = 'rect',
		width = '100%',
		height = '1rem',
		radius = 'var(--kante-s)',
		className = ''
	}: {
		shape?: 'rect' | 'circle';
		width?: string;
		height?: string;
		radius?: string;
		className?: string;
	} = $props();

	const schraffur =
		'repeating-linear-gradient(135deg, var(--muster-farbe) 0 6px, transparent 6px 12px)';
</script>

<!-- Schraffierte Fläche statt Puls. Der Container, der lädt, setzt `aria-busy`. -->
<div
	aria-hidden="true"
	class="border-[length:var(--rahmen-s)] border-tinte/30 {className}"
	style:width
	style:height
	style:border-radius={shape === 'circle' ? '50%' : radius}
	style:background-image={schraffur}
	style:background-color="var(--flaeche-2)"
></div>
