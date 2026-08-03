<script lang="ts">
	import { goto } from '$app/navigation';
	import { authState } from '$lib/core/auth.svelte';
	import { logout, logoutState } from '$lib/features/auth/logout.svelte';
	import { resetWelcome } from '$lib/features/dashboard/welcome';
	import { installState } from '$lib/core/install.svelte';
	import { pushState } from '$lib/core/push.svelte';
	import { themeState } from '$lib/core/theme.svelte';
	import { profileState, HEALTH_LIMITS } from '$lib/features/profile/store.svelte';
	import { HEIGHT_LIMITS, GLASS_SIZE_LIMITS, WATER_GOAL_ML_LIMITS } from '$lib/features/profile/units';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { remindersState } from '$lib/features/reminders/store.svelte';
	import { reminderAtOnDate } from '$lib/features/reminders/schedule';
	import { toISODate } from '$lib/core/date';
	import InviteForm from '$lib/features/workspace/components/InviteForm.svelte';
	import MemberList from '$lib/features/workspace/components/MemberList.svelte';
	import FocusSettingsFields from '$lib/features/profile/components/FocusSettingsFields.svelte';
	import { modules, bottomNavModuleIds } from '$lib/config/modules';
	import { resolveNavModules } from '$lib/config/nav';
	import { downloadExport } from '$lib/features/profile/export';
	import Button from '$lib/ui/Button.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import SettingRow from '$lib/ui/SettingRow.svelte';
	import NumberSetting from '$lib/ui/NumberSetting.svelte';
	import SegmentedControl from '$lib/ui/SegmentedControl.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Switch from '$lib/ui/Switch.svelte';
	import DeleteAccountSheet from '$lib/features/auth/components/DeleteAccountSheet.svelte';

	let deleteAccountOpen = $state(false);

	let displayNameInput = $state(profileState.displayName ?? '');
	$effect(() => {
		displayNameInput = profileState.displayName ?? '';
	});

	let timerSignalsPermission = $state<NotificationPermission | 'unsupported'>(
		typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
	);

	async function requestTimerSignals() {
		if (typeof window !== 'undefined' && 'Notification' in window) {
			const res = await Notification.requestPermission();
			timerSignalsPermission = res;
		}
	}

	// W10 — Weekly-Review-Erinnerung: aktiv = existiert als eigene Custom-Erinnerung.
	// Bewusst ohne `r.active`-Filter: eine pausierte Erinnerung ist immer noch da.
	// Sonst fand der Schalter sie nicht und legte beim Einschalten ein Duplikat an.
	const weeklyReviewReminder = $derived(
		remindersState.mine.find((r) => r.entity_type === 'custom' && r.title === 'Weekly Review')
	);

	/**
	 * Naechster Sonntag 18:00, der noch in der Zukunft liegt. An einem Sonntag nach
	 * 18:00 sonst ein Termin in der Vergangenheit — der Dispatch haette ihn beim
	 * naechsten Lauf sofort (bzw. verspaetet) zugestellt statt in einer Woche.
	 */
	function naechsterReviewTerminISO(): string {
		const d = new Date();
		d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
		if (reminderAtOnDate(toISODate(d), '18:00') <= new Date().toISOString()) {
			d.setDate(d.getDate() + 7);
		}
		return toISODate(d);
	}

	async function toggleWeeklyReviewReminder() {
		if (weeklyReviewReminder) {
			await remindersState.remove(weeklyReviewReminder.id);
			return;
		}
		await remindersState.add({
			entity_type: 'custom',
			entity_id: null,
			title: 'Weekly Review',
			body: 'Nimm dir 10 Minuten für deinen Wochenrückblick.',
			url: '/review',
			remind_at: reminderAtOnDate(naechsterReviewTerminISO(), '18:00'),
			rrule: 'RRULE:FREQ=WEEKLY;BYDAY=SU',
			offset_minutes: 0
		});
	}
</script>

<svelte:head>
	<title>Einstellungen - Life OS</title>
</svelte:head>

<PageHeader title="Einstellungen" subtitle={workspaceState.workspace?.name ?? ''} />

<div class="flex flex-col gap-6">
	<!-- Profil -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-text-primary">Profil</h2>
		<div class="flex flex-col divide-y divide-border-color/50">
			<SettingRow label="Anzeigename">
				<div class="flex items-center gap-2">
					<Input
						value={displayNameInput}
						onchange={(e) => { displayNameInput = (e.currentTarget as HTMLInputElement).value; }}
						class="w-32 min-h-9 px-2"
					/>
					<Button
						variant="secondary"
						onclick={() => profileState.setDisplayName(displayNameInput)}
					>
						Speichern
					</Button>
				</div>
			</SettingRow>
			<SettingRow label="E-Mail" hint={authState.user?.email ?? ''}>
				<div></div>
			</SettingRow>
			<SettingRow label="Körpergröße">
				<NumberSetting
					value={profileState.heightCm ?? 170}
					limits={HEIGHT_LIMITS}
					suffix="cm"
					onchange={(v) => profileState.setNumber('height_cm', v, HEIGHT_LIMITS)}
				/>
			</SettingRow>
		</div>
	</section>

	<!-- Einheiten -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-text-primary">Einheiten</h2>
		<div class="flex flex-col divide-y divide-border-color/50">
			<SettingRow label="Wasser">
				<SegmentedControl
					label="Einheit Wasser"
					options={[
						{ value: 'glasses', label: 'Gläser' },
						{ value: 'ml', label: 'Milliliter' }
					]}
					value={profileState.waterUnit}
					onchange={(v) => profileState.setWaterUnit(v as 'glasses' | 'ml')}
				/>
			</SettingRow>
			{#if profileState.waterUnit === 'glasses'}
				<SettingRow label="Glasgröße">
					<NumberSetting
						value={profileState.glassSizeMl}
						limits={GLASS_SIZE_LIMITS}
						suffix="ml"
						onchange={(v) => profileState.setNumber('glass_size_ml', v, GLASS_SIZE_LIMITS)}
					/>
				</SettingRow>
			{/if}
			<SettingRow label="Gewicht">
				<SegmentedControl
					label="Einheit Gewicht"
					options={[
						{ value: 'kg', label: 'kg' },
						{ value: 'lb', label: 'lb' }
					]}
					value={profileState.weightUnit}
					onchange={(v) => profileState.setWeightUnit(v as 'kg' | 'lb')}
				/>
			</SettingRow>
		</div>
	</section>

	<!-- Ziele -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-text-primary">Ziele</h2>
		<div class="flex flex-col divide-y divide-border-color/50">
			<SettingRow label="Wasser pro Tag">
				{#if profileState.waterUnit === 'ml'}
					<NumberSetting
						value={profileState.waterGoalMl}
						limits={WATER_GOAL_ML_LIMITS}
						suffix="ml"
						onchange={(v) => profileState.setNumber('water_goal_ml', v, WATER_GOAL_ML_LIMITS)}
					/>
				{:else}
					<NumberSetting
						value={profileState.waterGoalGlasses}
						limits={HEALTH_LIMITS.water_goal_glasses}
						suffix="Gläser"
						onchange={(v) => profileState.setHealthSetting('water_goal_glasses', v)}
					/>
				{/if}
			</SettingRow>
			
			<SettingRow label="Schlaf pro Nacht">
				<NumberSetting
					value={profileState.sleepGoalH}
					limits={HEALTH_LIMITS.sleep_goal_h}
					suffix="h"
					onchange={(v) => profileState.setHealthSetting('sleep_goal_h', v)}
				/>
			</SettingRow>

			<SettingRow label="Zielgewicht (optional)">
				<div class="flex items-center gap-2">
					<Input
						type="number"
						min="0"
						max="500"
						step="0.1"
						placeholder="—"
						value={profileState.weightGoalKg ?? ''}
						onchange={(e) => {
							const raw = (e.currentTarget as HTMLInputElement).value.trim();
							profileState.setWeightGoal(raw === '' ? null : Number(raw));
						}}
						class="w-24 text-center min-h-9 px-2"
					/>
					<span class="text-xs text-text-tertiary">kg</span>
				</div>
			</SettingRow>

			<SettingRow label="Trainings pro Woche">
				<NumberSetting
					value={profileState.weeklyWorkoutGoal}
					limits={{ min: 1, max: 14, step: 1 }}
					suffix="Workouts"
					onchange={(v) => profileState.setWeeklyWorkoutGoal(v)}
				/>
			</SettingRow>
		</div>
	</section>

	<!-- Fokus -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-text-primary">Fokus</h2>
		<FocusSettingsFields />
	</section>

	<!-- Darstellung -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-text-primary">Darstellung</h2>
		<div class="flex flex-col divide-y divide-border-color/50">
			<SettingRow label="Navigation (Unten 1)">
				<select
					value={resolveNavModules(profileState.settings.nav_module_ids)[0].id}
					onchange={(e) => {
						const current = resolveNavModules(profileState.settings.nav_module_ids).map(m => m.id);
						current[0] = e.currentTarget.value;
						profileState.setSettings({ nav_module_ids: current });
					}}
					class="rounded-lg border border-border-color bg-surface-2 px-2 py-1 text-sm text-text-primary"
				>
					{#each modules as m (m.id)}
						<option value={m.id}>{m.label}</option>
					{/each}
				</select>
			</SettingRow>
			<SettingRow label="Navigation (Unten 2)">
				<select
					value={resolveNavModules(profileState.settings.nav_module_ids)[1].id}
					onchange={(e) => {
						const current = resolveNavModules(profileState.settings.nav_module_ids).map(m => m.id);
						current[1] = e.currentTarget.value;
						profileState.setSettings({ nav_module_ids: current });
					}}
					class="rounded-lg border border-border-color bg-surface-2 px-2 py-1 text-sm text-text-primary"
				>
					{#each modules as m (m.id)}
						<option value={m.id}>{m.label}</option>
					{/each}
				</select>
			</SettingRow>
			<SettingRow label="Navigation (Unten 3)">
				<select
					value={resolveNavModules(profileState.settings.nav_module_ids)[2].id}
					onchange={(e) => {
						const current = resolveNavModules(profileState.settings.nav_module_ids).map(m => m.id);
						current[2] = e.currentTarget.value;
						profileState.setSettings({ nav_module_ids: current });
					}}
					class="rounded-lg border border-border-color bg-surface-2 px-2 py-1 text-sm text-text-primary"
				>
					{#each modules as m (m.id)}
						<option value={m.id}>{m.label}</option>
					{/each}
				</select>
			</SettingRow>
			<SettingRow label="Navigation (Unten 4)">
				<select
					value={resolveNavModules(profileState.settings.nav_module_ids)[3].id}
					onchange={(e) => {
						const current = resolveNavModules(profileState.settings.nav_module_ids).map(m => m.id);
						current[3] = e.currentTarget.value;
						profileState.setSettings({ nav_module_ids: current });
					}}
					class="rounded-lg border border-border-color bg-surface-2 px-2 py-1 text-sm text-text-primary"
				>
					{#each modules as m (m.id)}
						<option value={m.id}>{m.label}</option>
					{/each}
				</select>
			</SettingRow>
			
			<SettingRow label="Dunkles Design">
				<Switch label="Dunkles Design" checked={themeState.isDark} onchange={() => themeState.toggle()} />
			</SettingRow>
			<SettingRow label="Willkommens-Hinweis">
				<Button
					variant="secondary"
					onclick={async () => {
						resetWelcome();
						await goto('/');
					}}
				>
					Erneut zeigen
				</Button>
			</SettingRow>
			{#if installState.canInstall}
				<SettingRow label="App installieren">
					<Button variant="secondary" onclick={() => installState.install()}>
						Installieren
					</Button>
				</SettingRow>
			{:else if installState.installed}
				<SettingRow label="App ist installiert">
					<div></div>
				</SettingRow>
			{/if}
		</div>
	</section>

	<!-- Benachrichtigungen -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-text-primary">Benachrichtigungen</h2>
		<div class="flex flex-col divide-y divide-border-color/50">
			<SettingRow
				label="Timer-Signale"
				hint={timerSignalsPermission === 'granted'
					? 'Lokale Signale (Vibration, Ton & System-Push) bei Phasen- und Pausenende sind aktiv.'
					: timerSignalsPermission === 'denied'
					? 'System-Benachrichtigungen sind im Browser blockiert.'
					: 'Signalisiert Runden- und Pausenende lokal, auch wenn die App im Hintergrund ist.'}
			>
				{#if timerSignalsPermission === 'unsupported'}
					<span class="text-xs text-text-tertiary">Nicht unterstützt</span>
				{:else}
					<Switch
						label="Timer-Signale"
						checked={timerSignalsPermission === 'granted'}
						disabled={timerSignalsPermission === 'denied'}
						onchange={requestTimerSignals}
					/>
				{/if}
			</SettingRow>

			<SettingRow
				label="Weekly-Review-Erinnerung"
				hint="Sonntag 18:00 — eine kurze Erinnerung an deinen Wochenrückblick."
			>
				<Switch
					label="Weekly-Review-Erinnerung"
					checked={!!weeklyReviewReminder}
					onchange={toggleWeeklyReviewReminder}
				/>
			</SettingRow>

			{#if pushState.supported}
				<SettingRow
					label="Push-Benachrichtigungen"
					hint={pushState.subscribed
						? 'Aktiv auf diesem Gerät. Erinnerungen kommen auch bei geschlossener App.'
						: 'Ohne Push zeigt Life OS Erinnerungen nur bei geöffneter App.'}
				>
					<Switch
						label="Push-Benachrichtigungen"
						checked={pushState.subscribed}
						disabled={pushState.loading}
						onchange={() => (pushState.subscribed ? pushState.unsubscribe() : pushState.subscribe())}
					/>
				</SettingRow>
				{#if pushState.permission === 'denied'}
					<p class="text-xs text-red-500 mt-2 px-2">
						Benachrichtigungen sind im Browser blockiert. Bitte erlauben.
					</p>
				{/if}
			{:else}
				<SettingRow label="Push-Benachrichtigungen">
					<span class="text-xs text-text-tertiary">Nicht unterstützt</span>
				</SettingRow>
			{/if}
		</div>
	</section>

	<!-- Haushalt -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-text-primary">Haushalt: {workspaceState.workspace?.name ?? ''}</h2>
		<div class="flex flex-col gap-4">
			<MemberList members={workspaceState.members} />
			<InviteForm />
		</div>
	</section>

	<!-- Konto -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-text-primary">Konto</h2>
		<div class="flex flex-col divide-y divide-border-color/50">
			<SettingRow label="Daten exportieren" hint="Lädt alle Bereiche als JSON herunter">
				<Button variant="secondary" onclick={() => downloadExport()}>
					Exportieren
				</Button>
			</SettingRow>
			
			<SettingRow label="Konto löschen" hint="Alle Daten werden unwiderruflich gelöscht">
				<Button variant="danger" onclick={() => (deleteAccountOpen = true)}>Löschen</Button>
			</SettingRow>

			<div class="pt-4 mt-2">
				<Button variant="secondary" class="w-full" onclick={logout} loading={logoutState.loading}>
					{#snippet children()}
						{logoutState.loading ? 'Melde ab…' : 'Abmelden'}
					{/snippet}
				</Button>
			</div>
		</div>
	</section>

	<p class="text-center text-xs text-text-tertiary pb-8">
		Übungsdatenbank basiert auf <a href="https://wger.de" class="underline hover:text-text-secondary">wger.de</a> (CC-BY-SA).
	</p>
</div>

<DeleteAccountSheet bind:open={deleteAccountOpen} />
