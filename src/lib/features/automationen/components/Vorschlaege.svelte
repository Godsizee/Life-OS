<script lang="ts">
	import Button from '#lib/ui/Button.svelte';
	import { automationen } from '../laufzeit.svelte.js';
</script>

{#if automationen.vorschlaege.length > 0}
	<section
		aria-label="Offene Vorschläge"
		class="rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-800/60 dark:bg-primary-950/40"
	>
		<h2 class="mb-3 text-sm font-semibold text-text-primary">Offene Vorschläge</h2>
		<ul class="flex flex-col gap-3">
			{#each automationen.vorschlaege as v (v.id)}
				<li class="flex flex-col gap-2">
					<div>
						<p class="text-sm font-medium text-text-primary">{v.regelTitel}</p>
						<p class="text-xs leading-relaxed text-text-secondary">{v.erklaerung}</p>
					</div>
					<div class="flex flex-wrap gap-2">
						<Button onclick={() => automationen.bestaetige(v.id)}>Ja</Button>
						<Button variant="secondary" onclick={() => automationen.lehneAb(v.id)}>Nein</Button>
						<Button variant="secondary" onclick={() => automationen.nieWieder(v.id)}>
							Nie wieder
						</Button>
					</div>
				</li>
			{/each}
		</ul>
	</section>
{/if}
