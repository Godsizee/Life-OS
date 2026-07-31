<script lang="ts">
	import SettingRow from '$lib/ui/SettingRow.svelte';
	import NumberSetting from '$lib/ui/NumberSetting.svelte';
	import { FOCUS_LIMITS, profileState } from '$lib/features/profile/store.svelte';
</script>

<div class="flex flex-col divide-y divide-border-color/50">
	<SettingRow label="Fokusdauer" hint="Länge einer Runde">
		<NumberSetting
			value={profileState.focusMinutes}
			limits={FOCUS_LIMITS.focus_minutes}
			suffix="min"
			onchange={(v) => profileState.setFocusSetting('focus_minutes', v)}
		/>
	</SettingRow>

	<SettingRow label="Kurze Pause">
		<NumberSetting
			value={profileState.focusBreakMinutes}
			limits={FOCUS_LIMITS.focus_break_minutes}
			suffix="min"
			onchange={(v) => profileState.setFocusSetting('focus_break_minutes', v)}
		/>
	</SettingRow>

	<SettingRow label="Lange Pause">
		<NumberSetting
			value={profileState.focusLongBreakMinutes}
			limits={FOCUS_LIMITS.focus_long_break_minutes}
			suffix="min"
			onchange={(v) => profileState.setFocusSetting('focus_long_break_minutes', v)}
		/>
	</SettingRow>

	<SettingRow
		label="Runden bis zur Pause"
		hint="Tagessoll für den Life Score: {profileState.focusDailyGoalMinutes} min"
	>
		<NumberSetting
			value={profileState.focusRoundsUntilLongBreak}
			limits={FOCUS_LIMITS.focus_rounds_until_long_break}
			suffix="Runden"
			onchange={(v) => profileState.setFocusSetting('focus_rounds_until_long_break', v)}
		/>
	</SettingRow>

	<SettingRow label="Pausen-Timer" hint="Für Live-Workouts">
		<NumberSetting
			value={profileState.restTimerSeconds}
			limits={{ min: 15, max: 600, step: 1 }}
			suffix="Sek."
			onchange={(v) => profileState.setRestTimerSeconds(v)}
		/>
	</SettingRow>
</div>
