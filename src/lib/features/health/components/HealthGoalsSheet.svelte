<script lang="ts">
	import { profileState } from '$lib/features/profile/store.svelte';
	import { HEALTH_LIMITS } from '$lib/features/profile/store.svelte';
	import { kgToLb, lbToKg } from '$lib/features/profile/units';
	import Sheet from '$lib/ui/Sheet.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Button from '$lib/ui/Button.svelte';

	let { open = $bindable(false) } = $props();

	let sleepGoal = $state('');
	let waterGoal = $state('');
	let weightGoal = $state('');
	let saving = $state(false);

	$effect(() => {
		if (open) {
			sleepGoal = profileState.sleepGoalH.toString();
			if (profileState.waterUnit === 'ml') {
				waterGoal = profileState.waterGoalMl.toString();
			} else {
				waterGoal = profileState.waterGoalGlasses.toString();
			}
			const w = profileState.weightGoalKg;
			if (w != null) {
				weightGoal = (profileState.weightUnit === 'lb' ? kgToLb(w) : w).toString();
			} else {
				weightGoal = '';
			}
		}
	});

	async function save() {
		saving = true;
		try {
			await profileState.setHealthSetting('sleep_goal_h', parseFloat(sleepGoal));
			
			const parsedWater = parseInt(waterGoal);
			if (profileState.waterUnit === 'ml') {
				await profileState.setHealthSetting('water_goal_ml', parsedWater);
			} else {
				await profileState.setHealthSetting('water_goal_glasses', parsedWater);
			}

			const parsedWeight = weightGoal ? parseFloat(weightGoal) : null;
			if (parsedWeight !== null) {
				const kg = profileState.weightUnit === 'lb' ? lbToKg(parsedWeight) : parsedWeight;
				await profileState.setWeightGoal(kg);
			} else {
				await profileState.setWeightGoal(null);
			}

			open = false;
		} finally {
			saving = false;
		}
	}
</script>

<Sheet bind:open title="Gesundheits-Ziele">
	<div class="flex flex-col gap-4 p-4">
		<Field label="Schlafziel ({profileState.sleepGoalH} h)">
			<Input type="number" bind:value={sleepGoal} min={HEALTH_LIMITS.sleep_goal_h.min} max={HEALTH_LIMITS.sleep_goal_h.max} step={HEALTH_LIMITS.sleep_goal_h.step} />
		</Field>

		<Field label="Wasserziel ({profileState.waterUnit === 'ml' ? 'ml' : 'Gläser'})">
			{#if profileState.waterUnit === 'ml'}
				<Input type="number" bind:value={waterGoal} min={HEALTH_LIMITS.water_goal_ml.min} max={HEALTH_LIMITS.water_goal_ml.max} step={HEALTH_LIMITS.water_goal_ml.step} />
			{:else}
				<Input type="number" bind:value={waterGoal} min={HEALTH_LIMITS.water_goal_glasses.min} max={HEALTH_LIMITS.water_goal_glasses.max} step={HEALTH_LIMITS.water_goal_glasses.step} />
			{/if}
		</Field>

		<Field label="Zielgewicht ({profileState.weightUnit}, optional)">
			<Input type="number" bind:value={weightGoal} min="0" max="1000" step="0.1" />
		</Field>

		<Button onclick={save} disabled={saving}>
			{#snippet children()}
				{saving ? 'Speichere…' : 'Speichern'}
			{/snippet}
		</Button>
	</div>
</Sheet>
