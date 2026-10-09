<script lang="ts">
	import { goto } from '$app/navigation';
	import { setze } from '#lib/core/einstellungen.js';
	import Button from '#lib/ui/Button.svelte';
	import Sheet from '#lib/ui/Sheet.svelte';
	import { neuigkeitenGesehen } from '../einstellungen/hilfe.js';
	import { neueste } from '../neuigkeiten.js';

	let { open = $bindable(true) }: { open?: boolean } = $props();

	const n = neueste();

	// Egal wie das Blatt zugeht (Taste, Esc, Abdunklung): Die Version gilt danach als gesehen.
	$effect(() => {
		if (!open && n) void setze(neuigkeitenGesehen, n.version);
	});

	const schliessen = () => (open = false);

	function assistent() {
		open = false;
		void goto('/start?ansehen=1');
	}
</script>

{#if n}
	<Sheet bind:open title="Was ist neu">
		<div class="flex flex-col gap-4 p-4">
			<h3 class="text-2xl font-extrabold [font-stretch:85%]">{n.titel}</h3>
			<ul class="m-0 flex list-none flex-col gap-2 p-0">
				{#each n.punkte as p (p)}
					<li class="flex gap-3">
						<span
							class="mt-2 h-2.5 w-2.5 shrink-0 border-[length:var(--rahmen-s)] border-tinte bg-signal"
							aria-hidden="true"
						></span>
						<span>{p}</span>
					</li>
				{/each}
			</ul>
			{#if n.hilfe}
				<a
					href="/hilfe/{n.hilfe}"
					onclick={schliessen}
					class="mono-label self-start underline decoration-2 underline-offset-4"
				>
					Mehr dazu in der Hilfe
				</a>
			{/if}
			<div class="flex flex-wrap gap-2">
				<Button onclick={schliessen}>Verstanden</Button>
				<Button variant="sekundaer" onclick={assistent}>Assistent ansehen</Button>
			</div>
		</div>
	</Sheet>
{/if}
