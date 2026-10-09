<script lang="ts">
	import Ring from '#lib/ui/charts/Ring.svelte';

	let { score = 0, size = 120 }: { score?: number; size?: number } = $props();
</script>

<Ring
	wert={score}
	groesse={size}
	farbe="signal"
	text={String(score)}
	unter="Score"
	beschreibung="Life Score heute: {score} von 100"
/>
