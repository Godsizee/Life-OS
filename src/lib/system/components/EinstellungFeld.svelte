<script lang="ts" generics="T">
	import { setze, wert, type EinstellungDef } from '#lib/core/einstellungen.js';
	import Input from '#lib/ui/Input.svelte';
	import SegmentedControl from '#lib/ui/SegmentedControl.svelte';
	import Select from '#lib/ui/Select.svelte';
	import SettingRow from '#lib/ui/SettingRow.svelte';
	import Stepper from '#lib/ui/Stepper.svelte';
	import Switch from '#lib/ui/Switch.svelte';

	let { def }: { def: EinstellungDef<T> } = $props();

	const aktuell = $derived(wert(def));
	const speichere = (neu: unknown) => void setze(def as EinstellungDef<unknown>, neu);
	const ui = $derived(def.ui);
</script>

<SettingRow
	label={def.label}
	hint={def.hinweis}
	gestapelt={ui.art === 'auswahl' && ui.optionen.length > 1 && ui.optionen.length <= 3}
>
	{#if ui.art === 'schalter'}
		<Switch
			checked={aktuell as boolean}
			label={def.label}
			labelVersteckt
			onchange={(an) => speichere(an)}
		/>
	{:else if ui.art === 'auswahl'}
		{#if ui.optionen.length <= 3}
			<SegmentedControl
				label={def.label}
				value={String(aktuell)}
				options={ui.optionen.map((o) => ({ value: o.wert, label: o.label }))}
				onchange={(v) => speichere(v)}
			/>
		{:else}
			<Select
				aria-label={def.label}
				value={String(aktuell)}
				onchange={(e) => speichere(e.currentTarget.value)}
			>
				{#each ui.optionen as o (o.wert)}
					<option value={o.wert}>{o.label}</option>
				{/each}
			</Select>
		{/if}
	{:else if ui.art === 'zahl'}
		<Stepper
			label={def.label}
			value={aktuell as number}
			limits={{ min: ui.min, max: ui.max, step: ui.schritt }}
			suffix={ui.einheit}
			onchange={(n) => speichere(n)}
		/>
	{:else if ui.art === 'zeit'}
		<Input
			type="time"
			aria-label={def.label}
			value={aktuell as string}
			class="w-auto"
			onchange={(e) => {
				const v = e.currentTarget.value;
				if (v) speichere(v);
			}}
		/>
	{:else if ui.art === 'text'}
		<Input
			aria-label={def.label}
			value={aktuell as string}
			maxlength={ui.maxLaenge}
			onchange={(e) => speichere(e.currentTarget.value)}
		/>
	{/if}
</SettingRow>
