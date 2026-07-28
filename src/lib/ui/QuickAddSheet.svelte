<script lang="ts">
	import { tick } from 'svelte';
	import { Activity, Calendar, CheckSquare, Flame, Notebook, ShoppingCart, Target } from 'lucide-svelte';
	import { parseNLPInput } from '$lib/core/nlp-parse';
	import { dispatchNLP } from '$lib/features/dashboard/nlp-dispatch';
	import { toastState } from '$lib/core/toast.svelte';
	import { haptic } from '$lib/core/haptics';
	import Sheet from './Sheet.svelte';
	import Input from './Input.svelte';
	import Button from './Button.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	let text = $state('');
	let saving = $state(false);
	let field = $state<HTMLInputElement | null>(null);

	const parsed = $derived(text.trim() ? parseNLPInput(text.trim()) : null);

	// Dieselbe Zuordnung wie im Dashboard-Quick-Add: die Kategorie-Farben sind
	// bewusst neutrale Tailwind-Töne, damit sie sich von primary/accent abheben.
	const kinds: Record<string, { label: string; color: string; icon: typeof CheckSquare }> = {
		task: { label: 'Aufgabe', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400', icon: CheckSquare },
		shopping: { label: 'Einkauf', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400', icon: ShoppingCart },
		event: { label: 'Kalender', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400', icon: Calendar },
		health: { label: 'Gesundheit', color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400', icon: Activity },
		habit: { label: 'Routine', color: 'bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400', icon: Flame },
		note: { label: 'Notiz', color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400', icon: Notebook },
		goal: { label: 'Ziel', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400', icon: Target }
	};

	const kind = $derived(parsed ? (kinds[parsed.type] ?? null) : null);

	// Beim Öffnen direkt ins Feld – ein Tap auf den FAB soll zum Tippen führen,
	// nicht zu einem weiteren Tap.
	$effect(() => {
		if (!open) return;
		void tick().then(() => field?.focus());
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const value = text.trim();
		if (!value || saving) return;

		saving = true;
		try {
			const result = await dispatchNLP(value);
			if (result) {
				haptic(15);
				toastState.success(result);
				text = '';
				open = false;
			} else {
				toastState.error('Eingabe nicht erkannt – versuch es etwas konkreter.');
			}
		} catch {
			toastState.error('Konnte nicht gespeichert werden.');
		} finally {
			saving = false;
		}
	}
</script>

<Sheet bind:open title="Schnell erfassen">
	<form onsubmit={submit} class="flex flex-col gap-3 px-4 pb-4">
		<Input
			bind:element={field}
			bind:value={text}
			placeholder="z. B. 3x Eier, Morgen 10:00 Meeting, 75kg, Laufen"
			enterkeyhint="done"
			autocomplete="off"
		/>

		<div class="min-h-6">
			{#if kind}
				{@const KindIcon = kind.icon}
				<span
					class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold {kind.color}"
				>
					<KindIcon size={12} />
					Erkannt: {kind.label}
				</span>
			{:else if text.trim()}
				<span class="text-xs text-text-tertiary">Noch nichts erkannt – Eingabe wird als Aufgabe angelegt.</span>
			{/if}
		</div>

		<Button type="submit" fullWidth loading={saving} disabled={!text.trim()}>
			{#snippet children()}Hinzufügen{/snippet}
		</Button>
	</form>
</Sheet>
