import { authState } from '$lib/core/auth.svelte';
import * as profileApi from './api';
import type { ProfileSettings } from './types';

export const DEFAULT_WEEKLY_WORKOUT_GOAL = 3;
export const DEFAULT_REST_TIMER_SECONDS = 90;
// W6 — Pomodoro-Standard (25/5/15, lange Pause nach 4 Runden).
export const DEFAULT_FOCUS_MINUTES = 25;
export const DEFAULT_FOCUS_BREAK_MINUTES = 5;
export const DEFAULT_FOCUS_LONG_BREAK_MINUTES = 15;
export const DEFAULT_FOCUS_ROUNDS_UNTIL_LONG_BREAK = 4;

/** Grenzen für die Fokus-Einstellungen — eine Quelle für Store und UI. */
export const FOCUS_LIMITS = {
	focus_minutes: { min: 5, max: 120, step: 5 },
	focus_break_minutes: { min: 1, max: 60, step: 1 },
	focus_long_break_minutes: { min: 5, max: 60, step: 5 },
	focus_rounds_until_long_break: { min: 2, max: 8, step: 1 }
} as const;

export type FocusSettingKey = keyof typeof FOCUS_LIMITS;

class ProfileState {
	settings = $state<ProfileSettings>({});
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
	/** Tages-Soll für den Fokus-Anteil des Life Scores — abgeleitet, keine eigene Einstellung. */
	focusDailyGoalMinutes = $derived(this.focusMinutes * this.focusRoundsUntilLongBreak);

	async load() {
		const uId = authState.user?.id;
		if (!uId || this.userId === uId) return;
		this.userId = uId;
		this.loading = true;
		try {
			this.settings = await profileApi.getSettings(uId);
		} finally {
			this.loading = false;
		}
	}

	unload() {
		this.settings = {};
		this.userId = null;
	}

	async setWeeklyWorkoutGoal(goal: number) {
		const uId = authState.user?.id;
		if (!uId) return;
		const clamped = Math.max(1, Math.min(14, Math.round(goal)));
		this.settings = { ...this.settings, weekly_workout_goal: clamped };
		await profileApi.updateSettings(uId, this.settings);
	}

	async setRestTimerSeconds(seconds: number) {
		const uId = authState.user?.id;
		if (!uId) return;
		const clamped = Math.max(15, Math.min(600, Math.round(seconds)));
		this.settings = { ...this.settings, rest_timer_seconds: clamped };
		await profileApi.updateSettings(uId, this.settings);
	}

	/** Einzelne Fokus-Einstellung setzen; clamped gegen FOCUS_LIMITS. */
	async setFocusSetting(key: FocusSettingKey, value: number) {
		const uId = authState.user?.id;
		if (!uId) return;
		const { min, max } = FOCUS_LIMITS[key];
		const clamped = Math.max(min, Math.min(max, Math.round(value)));
		this.settings = { ...this.settings, [key]: clamped };
		await profileApi.updateSettings(uId, this.settings);
	}
}

export const profileState = new ProfileState();
