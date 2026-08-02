<script lang="ts">
	import Textarea from '$lib/ui/Textarea.svelte';

	let {
		reflGood = $bindable(''),
		reflHard = $bindable(''),
		reflChange = $bindable(''),
		saving,
		onBack,
		onFinish
	}: {
		reflGood: string;
		reflHard: string;
		reflChange: string;
		saving: boolean;
		onBack: () => void;
		onFinish: () => void;
	} = $props();
</script>

<section class="flex flex-col gap-4">
	<div>
		<h2 class="text-lg font-semibold text-text-primary">Reflexion</h2>
		<p class="mt-1 text-sm text-text-secondary">3 kurze Fragen — du musst nicht alle beantworten.</p>
	</div>

	<label class="flex flex-col gap-1.5">
		<span class="text-sm font-medium text-text-secondary">🌟 Was lief diese Woche gut?</span>
		<Textarea bind:value={reflGood} rows={3} placeholder="z.B. Alle Habits eingehalten, ein schwieriges Gespräch geführt…" />
	</label>

	<label class="flex flex-col gap-1.5">
		<span class="text-sm font-medium text-text-secondary">💪 Was war schwer oder hat nicht geklappt?</span>
		<Textarea bind:value={reflHard} rows={3} placeholder="z.B. Ablenkungen, zu viele Aufgaben auf einmal…" />
	</label>

	<label class="flex flex-col gap-1.5">
		<span class="text-sm font-medium text-text-secondary">🔄 Was ändere ich nächste Woche?</span>
		<Textarea bind:value={reflChange} rows={3} placeholder="z.B. Früher schlafen, täglich 1 Priorität setzen…" />
	</label>

	<div class="flex gap-3">
		<button
			onclick={onBack}
			class="min-h-12 flex-1 rounded-xl border border-border-color bg-surface-0 text-sm font-medium text-text-secondary hover:bg-surface-1"
		>
			← Zurück
		</button>
		<button
			onclick={onFinish}
			disabled={saving}
			class="min-h-12 flex-1 rounded-xl bg-primary-600 text-sm font-medium text-white active:bg-primary-700 disabled:opacity-60"
		>
			{saving ? 'Speichere…' : '✓ Abschließen'}
		</button>
	</div>

	<a href="/journal?kind=weekly" class="text-center text-xs text-text-tertiary hover:text-text-secondary">
		Frühere Reviews ansehen
	</a>
</section>
