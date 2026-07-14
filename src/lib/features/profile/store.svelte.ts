import { authState } from '$lib/core/auth.svelte';
import * as profileApi from './api';
import type { ProfileSettings } from './types';

export const DEFAULT_WEEKLY_WORKOUT_GOAL = 3;
export const DEFAULT_REST_TIMER_SECONDS = 90;

class ProfileState {
	settings = $state<ProfileSettings>({});
	loading = $state(false);
	private userId: string | null = null;

	weeklyWorkoutGoal = $derived(this.settings.weekly_workout_goal ?? DEFAULT_WEEKLY_WORKOUT_GOAL);
	restTimerSeconds = $derived(this.settings.rest_timer_seconds ?? DEFAULT_REST_TIMER_SECONDS);

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
}

export const profileState = new ProfileState();
