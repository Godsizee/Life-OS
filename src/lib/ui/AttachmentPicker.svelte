<script lang="ts">
	// Dumm: kennt weder Store noch Storage — meldet nur die gewaehlten Dateien.
	import { ImagePlus } from 'lucide-svelte';

	let {
		onpick,
		disabled = false,
		label = 'Bild hinzufügen'
	}: {
		onpick: (files: File[]) => void;
		disabled?: boolean;
		label?: string;
	} = $props();

	let input: HTMLInputElement | null = $state(null);

	function handleChange(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const files = Array.from(target.files ?? []);
		if (files.length > 0) onpick(files);
		target.value = ''; // dieselbe Datei soll erneut waehlbar sein
	}
</script>

<button
	type="button"
	{disabled}
	onclick={() => input?.click()}
	class="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-color bg-surface-0 px-4 text-sm font-medium text-text-secondary transition-transform active:scale-95 disabled:opacity-50"
>
	<ImagePlus size={18} />
	{label}
</button>

<input
	bind:this={input}
	type="file"
	accept="image/jpeg,image/png,image/webp,image/gif"
	multiple
	class="hidden"
	onchange={handleChange}
/>
