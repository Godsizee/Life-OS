<script lang="ts">
	import { Hammer, MessageCircle, Rocket } from 'lucide-svelte';
	import Button from '$lib/ui/Button.svelte';
	import Modal from '$lib/ui/Modal.svelte';
	import { hasSeenWelcome, markWelcomeSeen } from '../welcome';

	let open = $state(false);
	// Erst nach dem ersten Öffnen darf ein Schließen als "gesehen" zählen —
	// sonst würde der Startzustand (open = false) den Hinweis sofort abhaken.
	let armed = $state(false);

	$effect(() => {
		// Erst nach dem Mount aus localStorage lesen, nicht als Startwert: sonst
		// blitzt der Hinweis bei jedem Laden kurz auf (Muster aus DailyBrief).
		if (hasSeenWelcome()) return;
		open = true;
		armed = true;
	});

	$effect(() => {
		// Deckt jeden Weg ab: Knopf, Escape und Klick auf den Hintergrund.
		if (armed && !open) markWelcomeSeen();
	});

	const points = [
		{
			icon: Hammer,
			title: 'Vieles ist noch Baustelle',
			text: 'Module werden nach und nach fertig — manches sieht schon fertig aus, ist es aber noch nicht.'
		},
		{
			icon: Rocket,
			title: 'Deine Daten bleiben',
			text: 'Was du jetzt anlegst, geht bei Updates nicht verloren. Ausprobieren lohnt sich.'
		},
		{
			icon: MessageCircle,
			title: 'Sag, was fehlt',
			text: 'Rückmeldungen bestimmen, was als Nächstes gebaut wird — auch Kleinigkeiten.'
		}
	];
</script>

<Modal bind:open label="Willkommen bei Life OS">
	<div class="flex flex-col gap-5 p-5">
		<div class="flex flex-col gap-1.5">
			<span
				class="w-fit rounded-full bg-primary-active-bg px-2.5 py-1 text-xs font-semibold text-primary-active"
			>
				Beta
			</span>
			<h2 class="text-xl font-bold tracking-tight text-text-primary">Willkommen bei Life OS</h2>
			<p class="text-sm leading-relaxed text-text-secondary">
				Life OS steckt mitten in Umsetzung und Planung. Du siehst gerade eine frühe Fassung.
			</p>
		</div>

		<ul class="flex flex-col gap-3">
			{#each points as point (point.title)}
				{@const Icon = point.icon}
				<li class="flex gap-3">
					<span
						class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-text-secondary"
					>
						<Icon size={16} />
					</span>
					<div class="flex min-w-0 flex-col gap-0.5">
						<span class="text-sm font-semibold text-text-primary">{point.title}</span>
						<span class="text-sm leading-relaxed text-text-secondary">{point.text}</span>
					</div>
				</li>
			{/each}
		</ul>

		<Button onclick={() => (open = false)} fullWidth>
			{#snippet children()}Verstanden, los geht's{/snippet}
		</Button>

		<p class="text-center text-xs text-text-tertiary">
			Unter „Mehr“ lässt sich dieser Hinweis jederzeit erneut aufrufen.
		</p>
	</div>
</Modal>
