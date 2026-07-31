import { authState } from '$lib/core/auth.svelte';
import * as profileApi from './api';
import type { ProfileSettings } from './types';
import {
	DEFAULT_GLASS_SIZE_ML, GLASS_SIZE_LIMITS, HEIGHT_LIMITS, WATER_GOAL_ML_LIMITS,
	glassesToMl, type WaterUnit, type WeightUnit
} from './units';

export const DEFAULT_WEEKLY_WORKOUT_GOAL = 3;
export const DEFAULT_REST_TIMER_SECONDS = 90;
export const DEFAULT_FOCUS_MINUTES = 25;
export const DEFAULT_FOCUS_BREAK_MINUTES = 5;
export const DEFAULT_FOCUS_LONG_BREAK_MINUTES = 15;
export const DEFAULT_FOCUS_ROUNDS_UNTIL_LONG_BREAK = 4;

export const FOCUS_LIMITS = {
	focus_minutes: { min: 5, max: 120, step: 5 },
	focus_break_minutes: { min: 1, max: 60, step: 1 },
	focus_long_break_minutes: { min: 5, max: 60, step: 5 },
	focus_rounds_until_long_break: { min: 2, max: 8, step: 1 }
} as const;

export type FocusSettingKey = keyof typeof FOCUS_LIMITS;

export const DEFAULT_WATER_GOAL_GLASSES = 8;
export const DEFAULT_SLEEP_GOAL_H = 8;

export const HEALTH_LIMITS = {
	water_goal_glasses: { min: 1, max: 30, step: 1 },
	water_goal_ml: { min: 250, max: 6000, step: 250 },
	sleep_goal_h: { min: 4, max: 12, step: 0.5 }
} as const;

export type HealthSettingKey = keyof typeof HEALTH_LIMITS;

export const DEFAULT_WATER_UNIT: WaterUnit = 'glasses';
export const DEFAULT_WEIGHT_UNIT: WeightUnit = 'kg';

class ProfileState {
	settings = $state<ProfileSettings>({});
	displayName = $state<string | null>(null);
	loading = $state(false);
	private userId: string | null = null;

	weeklyWorkoutGoal = $derived(this.settings.weekly_workout_goal ?? DEFAULT_WEEKLY_WORKOUT_GOAL);
	restTimerSeconds = $derived(this.settings.rest_timer_seconds ?? DEFAULT_REST_TIMER_SECONDS);
	focusMinutes = $derived(this.settings.focus_minutes ?? DEFAULT_FOCUS_MINUTES);
	focusBreakMinutes = $derived(this.settings.focus_break_minutes ?? DEFAULT_FOCUS_BREAK_MINUTES);
	focusLongBreakMinutes = $derived(
		this.settings.focus_long_break_minutes ?? DEFAULT_FOCUS_LONG_BREAK_MINUTES
	);
	focusRoundsUntilLongBreak = $derived(
		this.settings.focus_rounds_until_long_break ?? DEFAULT_FOCUS_ROUNDS_UNTIL_LONG_BREAK
	);
	waterGoalGlasses = $derived(this.settings.water_goal_glasses ?? DEFAULT_WATER_GOAL_GLASSES);
	sleepGoalH = $derived(this.settings.sleep_goal_h ?? DEFAULT_SLEEP_GOAL_H);
	weightGoalKg = $derived(this.settings.weight_goal_kg ?? null);

	waterUnit = $derived(this.settings.water_unit ?? DEFAULT_WATER_UNIT);
	weightUnit = $derived(this.settings.weight_unit ?? DEFAULT_WEIGHT_UNIT);
	glassSizeMl = $derived(this.settings.glass_size_ml ?? DEFAULT_GLASS_SIZE_ML);
	heightCm = $derived(this.settings.height_cm ?? null);

	waterGoalMl = $derived(
		this.settings.water_goal_ml ??
			glassesToMl(this.settings.water_goal_glasses ?? DEFAULT_WATER_GOAL_GLASSES, this.glassSizeMl)
	);

	focusDailyGoalMinutes = $derived(
		this.settings.focus_daily_goal_minutes ?? this.focusMinutes * this.focusRoundsUntilLongBreak
	);

	async load() {
		const uId = authState.user?.id;
		if (!uId || this.userId === uId) return;
		this.userId = uId;
		this.loading = true;
		try {
			const profile = await profileApi.getProfile(uId);
			this.settings = profile.settings;
			this.displayName = profile.display_name;
		} finally {
			this.loading = false;
		}
	}

	unload() {
		this.settings = {};
		this.displayName = null;
		this.userId = null;
	}

	async setSettings(partial: Partial<ProfileSettings>) {
		const uId = authState.user?.id;
		if (!uId) return;
		this.settings = { ...this.settings, ...partial };
		await profileApi.updateSettings(uId, this.settings);
	}

	async setNumber(
		key: keyof ProfileSettings,
		value: number,
		limits: { min: number; max: number; step: number }
	) {
		const uId = authState.user?.id;
		if (!uId) return;
		const snapped = Math.round(value / limits.step) * limits.step;
		const clamped = Math.max(limits.min, Math.min(limits.max, snapped));
		this.settings = { ...this.settings, [key]: clamped };
		await profileApi.updateSettings(uId, this.settings);
	}

	async setWeeklyWorkoutGoal(goal: number) {
		await this.setNumber('weekly_workout_goal', goal, { min: 1, max: 14, step: 1 });
	}

	async setRestTimerSeconds(seconds: number) {
		await this.setNumber('rest_timer_seconds', seconds, { min: 15, max: 600, step: 1 });
	}

	async setFocusSetting(key: FocusSettingKey, value: number) {
		await this.setNumber(key, value, FOCUS_LIMITS[key]);
	}

	async setHealthSetting(key: HealthSettingKey, value: number) {
		await this.setNumber(key, value, HEALTH_LIMITS[key]);
	}

	async setWeightGoal(kg: number | null) {
		const uId = authState.user?.id;
		if (!uId) return;
		const value =
			kg === null || !Number.isFinite(kg) || kg <= 0
				? null
				: Math.round(Math.min(500, kg) * 10) / 10;
		this.settings = { ...this.settings, weight_goal_kg: value };
		await profileApi.updateSettings(uId, this.settings);
	}

	async setWaterUnit(unit: WaterUnit) {
		const uId = authState.user?.id;
		if (!uId) return;
		this.settings = { ...this.settings, water_unit: unit };
		await profileApi.updateSettings(uId, this.settings);
	}

	async setWeightUnit(unit: WeightUnit) {
		const uId = authState.user?.id;
		if (!uId) return;
		this.settings = { ...this.settings, weight_unit: unit };
		await profileApi.updateSettings(uId, this.settings);
	}

	async setDisplayName(name: string) {
		const uId = authState.user?.id;
		const trimmed = name.trim();
		if (!uId || trimmed.length === 0 || trimmed.length > 60) return;
		await profileApi.updateDisplayName(uId, trimmed);
		this.displayName = trimmed;
	}
}

export const profileState = new ProfileState();
