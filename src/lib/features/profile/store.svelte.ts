import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { ladeSicher } from '$lib/core/store-load';
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

/**
 * Beide Schreibwege gehen auf dieselbe Tabelle, treffen aber verschiedene
 * Spalten — die Outbox schluesselt nur nach Tabellenname, deshalb hier
 * unterscheidbar gemacht.
 */
type ProfileMutation =
	| { kind: 'settings'; patch: Partial<ProfileSettings> }
	| { kind: 'display_name'; userId: string; value: string };

class ProfileState {
	settings = $state<ProfileSettings>({});
	displayName = $state<string | null>(null);
	loading = $state(false);
	private userId: string | null = null;

	constructor() {
		outbox.registerExecutor('profiles', {
			update: (payload) => {
				const m = payload as ProfileMutation;
				return m.kind === 'settings'
					? profileApi.mergeSettings(m.patch)
					: profileApi.updateDisplayName(m.userId, m.value);
			}
		});
	}

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
		// Ohne ladeSicher flog der Fehler in das Promise.allSettled von
		// loadWorkspaceData() und verschwand dort. Der Nutzer sah still die
		// Standardwerte (8 Gläser, 25 min) statt seiner eigenen Ziele.
		const ok = await ladeSicher('Einstellungen', async () => {
			const profile = await profileApi.getProfile(uId);
			this.settings = profile.settings;
			this.displayName = profile.display_name;
		});
		this.loading = false;
		if (!ok) this.userId = null; // naechster Aufruf versucht es erneut
	}

	/** Erneut vom Server laden — Abgleich nach Verbindungsabbruch (core/resync.ts). */
	async reload() {
		this.userId = null;
		await this.load();
	}

	unload() {
		this.settings = {};
		this.displayName = null;
		this.userId = null;
	}

	/**
	 * Einstellungen aendern — optimistisch lokal, dann ueber die Outbox.
	 *
	 * Vorher schrieb jede Aenderung direkt gegen die API: offline ging sie
	 * ersatzlos verloren, obwohl die App ein Offline-Banner zeigt. Und weil
	 * dabei das komplette Objekt rausging, ueberschrieben zwei Geraete
	 * gegenseitig ihre Aenderungen. Jetzt wandert nur der Patch raus und wird
	 * serverseitig zusammengefuehrt (siehe api.mergeSettings).
	 */
	async setSettings(partial: Partial<ProfileSettings>) {
		if (!authState.user?.id) return;
		this.settings = { ...this.settings, ...partial };
		await outbox.runOrQueue('profiles', 'update', { kind: 'settings', patch: partial }, () =>
			profileApi.mergeSettings(partial)
		);
	}

	async setNumber(
		key: keyof ProfileSettings,
		value: number,
		limits: { min: number; max: number; step: number }
	) {
		const snapped = Math.round(value / limits.step) * limits.step;
		const clamped = Math.max(limits.min, Math.min(limits.max, snapped));
		await this.setSettings({ [key]: clamped });
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
		const value =
			kg === null || !Number.isFinite(kg) || kg <= 0
				? null
				: Math.round(Math.min(500, kg) * 10) / 10;
		await this.setSettings({ weight_goal_kg: value });
	}

	async setWaterUnit(unit: WaterUnit) {
		await this.setSettings({ water_unit: unit });
	}

	async setWeightUnit(unit: WeightUnit) {
		await this.setSettings({ weight_unit: unit });
	}

	async setDisplayName(name: string) {
		const uId = authState.user?.id;
		const trimmed = name.trim();
		if (!uId || trimmed.length === 0 || trimmed.length > 60) return;
		this.displayName = trimmed;
		await outbox.runOrQueue(
			'profiles',
			'update',
			{ kind: 'display_name', userId: uId, value: trimmed },
			() => profileApi.updateDisplayName(uId, trimmed)
		);
	}
}

export const profileState = new ProfileState();
