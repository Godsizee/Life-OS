<script lang="ts">
	// Drei Quadrate, nacheinander gefüllt. Die Größe kommt per Inline-Style, weil Tailwind
	// keine dynamischen Klassennamen auflöst. Ohne `label` ist der Spinner reine Deko
	// (z. B. im Button, der selbst `aria-busy` trägt); mit `label` ist er ein Status.
	let {
		size = 16,
		label,
		class: className = ''
	}: { size?: number; label?: string; class?: string } = $props();

	const kante = $derived(Math.max(4, Math.round(size / 3.2)));
</script>

<span
	role={label ? 'status' : undefined}
	aria-hidden={label ? undefined : 'true'}
	class="inline-flex shrink-0 items-center gap-0.5 {label ? 'spinner-mit-label' : ''} {className}"
	style="height: {size}px"
>
	<span class="spinner-quadrate inline-flex items-center gap-0.5" aria-hidden="true">
		{#each [0, 1, 2] as i (i)}
			<span
				class="spinner-quadrat inline-block border-[1.5px] border-current"
				style="width: {kante}px; height: {kante}px; animation-delay: {i * 160}ms"
			></span>
		{/each}
	</span>
	{#if label}
		<!-- Bei reduzierter Bewegung steht statt der Animation der Text da. -->
		<span class="spinner-statisch mono-label ml-1">{label} …</span>
		<span class="sr-only">{label}</span>
	{/if}
</span>
