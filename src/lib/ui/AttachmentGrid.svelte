<script lang="ts">
	// Dumm: bekommt fertige Kacheln (id + src) und meldet Klick/Loeschen zurueck.
	import { ImageOff, Loader2, X } from 'lucide-svelte';

	interface Tile {
		id: string;
		/** null = noch keine URL (offline oder Upload laeuft). */
		src: string | null;
		alt: string;
	}

	let {
		tiles,
		onopen,
		ondelete,
		readonly = false
	}: {
		tiles: Tile[];
		onopen?: (index: number) => void;
		ondelete?: (id: string) => void;
		readonly?: boolean;
	} = $props();
</script>

{#if tiles.length > 0}
	<ul class="grid grid-cols-3 gap-2 sm:grid-cols-4">
		{#each tiles as tile, index (tile.id)}
			<li class="relative">
				<button
					type="button"
					onclick={() => onopen?.(index)}
					class="block aspect-square w-full overflow-hidden rounded-xl border border-border-color bg-surface-1 transition-transform active:scale-95"
				>
					{#if tile.src}
						<img src={tile.src} alt={tile.alt} loading="lazy" class="h-full w-full object-cover" />
					{:else}
						<span class="flex h-full w-full items-center justify-center text-text-tertiary">
							<Loader2 size={18} class="animate-spin" />
						</span>
					{/if}
				</button>

				{#if !readonly && ondelete}
					<button
						type="button"
						onclick={() => ondelete(tile.id)}
						aria-label="Anhang entfernen"
						class="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-border-color bg-surface-0 text-text-secondary shadow-sm active:scale-95"
					>
						<X size={14} />
					</button>
				{/if}
			</li>
		{/each}
	</ul>
{:else if readonly}
	<p class="flex items-center gap-2 text-xs text-text-tertiary">
		<ImageOff size={14} /> Keine Anhänge
	</p>
{/if}
