<script lang="ts">
	import { goto } from '$app/navigation';
	import { authState } from '#lib/core/auth.svelte.js';
	import { logout, logoutState } from '#lib/features/auth/logout.svelte.js';
	import { installState } from '#lib/core/install.svelte.js';
	import { erlaubnis } from '#lib/core/erlaubnis.svelte.js';
	import { setze, wert } from '#lib/core/einstellungen.js';
	import { entfernePause, fuegePauseHinzu, ruhePausen, type Pause } from '#lib/core/ruhe.js';
	import { toastState } from '#lib/core/toast.svelte.js';
	import { themeState, type ThemaModus } from '#lib/core/theme.svelte.js';
	import { hilfeGesehen } from '#lib/system/einstellungen/hilfe.js';
	import { pushState } from '#lib/features/reminders/push.svelte.js';
	import { profileState, HEALTH_LIMITS } from '#lib/features/profile/store.svelte.js';
	import {
		HEIGHT_LIMITS,
		GLASS_SIZE_LIMITS,
		WATER_GOAL_ML_LIMITS
	} from '#lib/features/profile/units.js';
	import { workspaceState } from '#lib/features/workspace/store.svelte.js';
	import { remindersState } from '#lib/features/reminders/store.svelte.js';
	import { reminderAtOnDate } from '#lib/features/reminders/schedule.js';
	import { toISODate } from '#lib/core/date.js';
	import InviteForm from '#lib/features/workspace/components/InviteForm.svelte';
	import MemberList from '#lib/features/workspace/components/MemberList.svelte';
	import FocusSettingsFields from '#lib/features/profile/components/FocusSettingsFields.svelte';
	import { modules } from '#lib/config/modules.js';
	import { resolveNavModules } from '#lib/config/nav.js';
	import { istAktiv } from '#lib/system/module-aktiv.svelte.js';
	import { downloadExport } from '#lib/system/export.js';
	import { abschnitte, type Abschnitt } from '#lib/system/einstellungen/abschnitte.js';
	import EinstellungsAbschnitt from '#lib/system/components/EinstellungsAbschnitt.svelte';
	import Button from '#lib/ui/Button.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import SettingRow from '#lib/ui/SettingRow.svelte';
	import NumberSetting from '#lib/ui/NumberSetting.svelte';
	import SegmentedControl from '#lib/ui/SegmentedControl.svelte';
	import Input from '#lib/ui/Input.svelte';
	import Select from '#lib/ui/Select.svelte';
	import Switch from '#lib/ui/Switch.svelte';
	import DeleteAccountSheet from '#lib/features/auth/components/DeleteAccountSheet.svelte';

	let deleteAccountOpen = $state(false);
	let suche = $state('');

	const register = $derived(abschnitte());
	const finde = (id: string): Abschnitt => register.find((a) => a.id === id) as Abschnitt;
	const statisch = (id: string, titel: string, hinweis: string): Abschnitt => ({
		id,
		titel,
		hinweis,
		defs: []
	});

	let displayNameInput = $state(profileState.displayName ?? '');
	$effect(() => {
		displayNameInput = profileState.displayName ?? '';
	});

	let timerSignalsPermission = $state<NotificationPermission | 'unsupported'>(
		typeof window !== 'undefined' && 'Notification' in window
			? Notification.permission
			: 'unsupported'
	);

	async function requestTimerSignals() {
		if (typeof window !== 'undefined' && 'Notification' in window) {
			const res = await erlaubnis.frageNach('timer');
			if (res !== 'nicht-unterstuetzt') timerSignalsPermission = res;
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

	// ── Navigation unten ────────────────────────────────────────────────────
	const navIds = $derived(
		resolveNavModules(profileState.settings.nav_module_ids, istAktiv).map((m): string => m.id)
	);
	function setzeNavPlatz(platz: number, id: string) {
		const neu = [...navIds];
		neu[platz] = id;
		void profileState.setSettings({ nav_module_ids: neu });
	}

	// ── Ruhe: Pausen ────────────────────────────────────────────────────────
	const GRUENDE: { wert: Pause['grund']; label: string }[] = [
		{ wert: 'urlaub', label: 'Urlaub' },
		{ wert: 'krank', label: 'Krank' },
		{ wert: 'abwesend', label: 'Abwesend' },
		{ wert: 'sonstiges', label: 'Sonstiges' }
	];
	const grundLabel = (g: Pause['grund']) => GRUENDE.find((x) => x.wert === g)?.label ?? g;
	const pausen = $derived([...wert(ruhePausen)].sort((a, b) => b.von.localeCompare(a.von)));
	const kurz = (iso: string) => iso.split('-').reverse().join('.');

	let pauseGrund = $state<Pause['grund']>('urlaub');
	let pauseVon = $state('');
	let pauseBis = $state('');
	const pauseOk = $derived(!!pauseVon && !!pauseBis && pauseVon <= pauseBis);

	async function pauseEintragen() {
		if (!pauseOk) return;
		await fuegePauseHinzu({ von: pauseVon, bis: pauseBis, grund: pauseGrund });
		pauseVon = '';
		pauseBis = '';
		toastState.success('Pause eingetragen. Deine Serien bleiben erhalten.');
	}
</script>

<svelte:head>
	<title>Einstellungen - Life OS</title>
</svelte:head>

<PageHeader title="Einstellungen" subtitle={workspaceState.workspace?.name ?? ''} />

<div class="flex flex-col gap-6">
	<Input
		type="search"
		bind:value={suche}
		placeholder="Einstellung suchen"
		aria-label="Einstellungen durchsuchen"
	/>

	<!-- Profil -->
	<EinstellungsAbschnitt
		abschnitt={statisch('profil', 'Profil', 'Dein Name und deine Körpergröße.')}
		{suche}
		eigeneStichwoerter="Anzeigename E-Mail Körpergröße Name"
	>
		{#snippet eigene()}
			<SettingRow label="Anzeigename">
				<div class="flex items-center gap-2">
					<Input
						value={displayNameInput}
						aria-label="Anzeigename"
						onchange={(e) => {
							displayNameInput = (e.currentTarget as HTMLInputElement).value;
						}}
						class="min-h-9 w-32! px-2"
					/>
					<Button variant="secondary" onclick={() => profileState.setDisplayName(displayNameInput)}>
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
					label="Körpergröße"
					onchange={(v) => profileState.setNumber('height_cm', v, HEIGHT_LIMITS)}
				/>
			</SettingRow>
		{/snippet}
	</EinstellungsAbschnitt>

	<!-- Darstellung -->
	<EinstellungsAbschnitt
		abschnitt={finde('darstellung')}
		{suche}
		eigeneStichwoerter="Thema hell dunkel system App installieren"
	>
		{#snippet eigene()}
			<SettingRow label="Thema" hint="Folgt sonst der Einstellung deines Geräts." gestapelt>
				<SegmentedControl
					label="Thema"
					value={themeState.modus}
					options={[
						{ value: 'system', label: 'System' },
						{ value: 'hell', label: 'Hell' },
						{ value: 'dunkel', label: 'Dunkel' }
					]}
					onchange={(v) => void themeState.setzeModus(v as ThemaModus)}
				/>
			</SettingRow>
			{#if installState.canInstall}
				<SettingRow label="App installieren">
					<Button variant="secondary" onclick={() => installState.install()}>Installieren</Button>
				</SettingRow>
			{:else if installState.installed}
				<SettingRow label="App ist installiert">
					<div></div>
				</SettingRow>
			{/if}
		{/snippet}
	</EinstellungsAbschnitt>

	<!-- Module -->
	<EinstellungsAbschnitt
		abschnitt={finde('module')}
		{suche}
		eigeneStichwoerter="Navigation unten Leiste Plätze"
	>
		{#snippet eigene()}
			{#each [0, 1, 2, 3] as platz (platz)}
				<SettingRow
					label="Navigation unten, Platz {platz + 1}"
					hint={platz === 0 ? 'Die vier Plätze unten in der App.' : undefined}
				>
					<Select
						aria-label="Navigation unten, Platz {platz + 1}"
						value={navIds[platz]}
						onchange={(e) => setzeNavPlatz(platz, e.currentTarget.value)}
						class="w-44"
					>
						{#each modules.filter((m) => istAktiv(m.id)) as m (m.id)}
							<option value={m.id}>{m.label}</option>
						{/each}
					</Select>
				</SettingRow>
			{/each}
		{/snippet}
	</EinstellungsAbschnitt>

	<EinstellungsAbschnitt abschnitt={finde('heute')} {suche} />
	<EinstellungsAbschnitt abschnitt={finde('hinweise')} {suche} />
	<EinstellungsAbschnitt abschnitt={finde('score')} {suche} />

	<!-- Ruhe & Pausen -->
	<EinstellungsAbschnitt
		abschnitt={statisch(
			'ruhe',
			'Ruhe & Pausen',
			'Während einer Pause bleiben Serien deiner Routinen erhalten.'
		)}
		{suche}
		eigeneStichwoerter="Pause Urlaub Krank abwesend Serie"
	>
		{#snippet eigene()}
			<div class="flex flex-col gap-3 p-2">
				{#if pausen.length === 0}
					<p class="text-sm text-text-2">Keine Pause eingetragen.</p>
				{:else}
					<ul class="m-0 flex list-none flex-col p-0">
						{#each pausen as p (p.von + p.bis)}
							<li
								class="flex flex-wrap items-center justify-between gap-2 border-b-[length:var(--rahmen-s)] border-tinte/20 py-2 last:border-b-0"
							>
								<span class="font-semibold">
									{kurz(p.von)} – {kurz(p.bis)}
									<span class="mono-label ml-2 text-text-3">{grundLabel(p.grund)}</span>
								</span>
								<Button size="sm" variant="ghost" onclick={() => entfernePause(p)}>Löschen</Button>
							</li>
						{/each}
					</ul>
				{/if}
				<form
					class="flex flex-col gap-2"
					onsubmit={(e) => {
						e.preventDefault();
						void pauseEintragen();
					}}
				>
					<h3 class="mono-label text-text-3">Pause hinzufügen</h3>
					<div class="flex flex-wrap items-end gap-2">
						<label class="mono-label flex flex-col gap-1">
							Von
							<Input type="date" bind:value={pauseVon} class="w-auto" />
						</label>
						<label class="mono-label flex flex-col gap-1">
							Bis
							<Input type="date" bind:value={pauseBis} class="w-auto" />
						</label>
						<label class="mono-label flex flex-col gap-1">
							Grund
							<Select bind:value={pauseGrund} class="w-auto">
								{#each GRUENDE as g (g.wert)}
									<option value={g.wert}>{g.label}</option>
								{/each}
							</Select>
						</label>
						<Button type="submit" variant="sekundaer" disabled={!pauseOk}>Eintragen</Button>
					</div>
				</form>
			</div>
		{/snippet}
	</EinstellungsAbschnitt>

	<!-- Benachrichtigungen -->
	<EinstellungsAbschnitt
		abschnitt={statisch(
			'benachrichtigungen',
			'Benachrichtigungen',
			'Wann und wie dich Life OS erinnert. Vorher erklärt die App, wozu.'
		)}
		{suche}
		eigeneStichwoerter="Timer Signale Push Weekly Review Erinnerung"
	>
		{#snippet eigene()}
			<SettingRow
				label="Timer-Signale"
				hint={timerSignalsPermission === 'granted'
					? 'Lokale Signale (Vibration, Ton & System-Push) bei Phasen- und Pausenende sind aktiv.'
					: timerSignalsPermission === 'denied'
						? 'System-Benachrichtigungen sind im Browser blockiert.'
						: 'Signalisiert Runden- und Pausenende lokal, auch wenn die App im Hintergrund ist.'}
			>
				{#if timerSignalsPermission === 'unsupported'}
					<span class="text-xs text-text-3">Nicht unterstützt</span>
				{:else}
					<Switch
						label="Timer-Signale"
						labelVersteckt
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
					labelVersteckt
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
						labelVersteckt
						checked={pushState.subscribed}
						disabled={pushState.loading}
						onchange={() =>
							pushState.subscribed ? pushState.unsubscribe() : pushState.subscribe()}
					/>
				</SettingRow>
				{#if pushState.permission === 'denied'}
					<p class="mt-2 px-2 text-xs text-gefahr">
						Benachrichtigungen sind im Browser blockiert. Bitte erlauben.
					</p>
				{/if}
			{:else}
				<SettingRow label="Push-Benachrichtigungen">
					<span class="text-xs text-text-3">Nicht unterstützt</span>
				</SettingRow>
			{/if}
		{/snippet}
	</EinstellungsAbschnitt>

	<!-- Verknüpfungen -->
	<EinstellungsAbschnitt
		abschnitt={finde('automationen')}
		{suche}
		eigeneStichwoerter="Module verbinden Regeln Automationen"
	>
		{#snippet eigene()}
			<SettingRow
				label="Module verbinden"
				hint="z. B. Training hakt eine Routine ab. Sichtbar, abschaltbar, mit Rückgängig."
			>
				<a
					href="/settings/automationen"
					class="mono-label inline-flex min-h-10 items-center underline decoration-2 underline-offset-4"
				>
					Öffnen
				</a>
			</SettingRow>
		{/snippet}
	</EinstellungsAbschnitt>

	<!-- Hilfe -->
	<EinstellungsAbschnitt
		abschnitt={finde('hilfe')}
		{suche}
		eigeneStichwoerter="Einrichtung Assistent Einführungen Tipps"
	>
		{#snippet eigene()}
			<SettingRow
				label="Einrichtung"
				hint="Den Assistenten noch einmal durchgehen, ohne etwas zurückzusetzen."
			>
				<Button variant="secondary" onclick={() => goto('/start?ansehen=1')}>Ansehen</Button>
			</SettingRow>
			<SettingRow label="Einführungen der Module">
				<Button
					variant="secondary"
					onclick={async () => {
						await setze(hilfeGesehen, []);
						toastState.success('Die Einführungen der Module erscheinen wieder.');
					}}
				>
					Erneut zeigen
				</Button>
			</SettingRow>
		{/snippet}
	</EinstellungsAbschnitt>

	<!-- Einheiten -->
	<EinstellungsAbschnitt
		abschnitt={statisch('einheiten', 'Einheiten', 'Wie Wasser und Gewicht angezeigt werden.')}
		{suche}
		eigeneStichwoerter="Wasser Gläser Milliliter Gewicht kg lb Glasgröße"
	>
		{#snippet eigene()}
			<SettingRow label="Wasser" gestapelt>
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
						label="Glasgröße"
						onchange={(v) => profileState.setNumber('glass_size_ml', v, GLASS_SIZE_LIMITS)}
					/>
				</SettingRow>
			{/if}
			<SettingRow label="Gewicht" gestapelt>
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
		{/snippet}
	</EinstellungsAbschnitt>

	<!-- Ziele -->
	<EinstellungsAbschnitt
		abschnitt={statisch('ziele', 'Ziele', 'Tagesziele für Gesundheit und Training.')}
		{suche}
		eigeneStichwoerter="Wasser Schlaf Zielgewicht Training Workouts pro Woche"
	>
		{#snippet eigene()}
			<SettingRow label="Wasser pro Tag">
				{#if profileState.waterUnit === 'ml'}
					<NumberSetting
						value={profileState.waterGoalMl}
						limits={WATER_GOAL_ML_LIMITS}
						suffix="ml"
						label="Wasser pro Tag"
						onchange={(v) => profileState.setNumber('water_goal_ml', v, WATER_GOAL_ML_LIMITS)}
					/>
				{:else}
					<NumberSetting
						value={profileState.waterGoalGlasses}
						limits={HEALTH_LIMITS.water_goal_glasses}
						suffix="Gläser"
						label="Wasser pro Tag"
						onchange={(v) => profileState.setHealthSetting('water_goal_glasses', v)}
					/>
				{/if}
			</SettingRow>

			<SettingRow label="Schlaf pro Nacht">
				<NumberSetting
					value={profileState.sleepGoalH}
					limits={HEALTH_LIMITS.sleep_goal_h}
					suffix="h"
					label="Schlaf pro Nacht"
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
						aria-label="Zielgewicht"
						value={profileState.weightGoalKg ?? ''}
						onchange={(e) => {
							const raw = (e.currentTarget as HTMLInputElement).value.trim();
							profileState.setWeightGoal(raw === '' ? null : Number(raw));
						}}
						class="min-h-9 w-24 px-2 text-center"
					/>
					<span class="text-xs text-text-3">kg</span>
				</div>
			</SettingRow>

			<SettingRow label="Trainings pro Woche">
				<NumberSetting
					value={profileState.weeklyWorkoutGoal}
					limits={{ min: 1, max: 14, step: 1 }}
					suffix="Workouts"
					label="Trainings pro Woche"
					onchange={(v) => profileState.setWeeklyWorkoutGoal(v)}
				/>
			</SettingRow>
		{/snippet}
	</EinstellungsAbschnitt>

	<!-- Fokus -->
	<EinstellungsAbschnitt
		abschnitt={statisch('fokus', 'Fokus', 'Länge der Runden und Pausen.')}
		{suche}
		eigeneStichwoerter="Runde Pause Minuten Tagesziel Fokus Timer"
	>
		{#snippet eigene()}
			<FocusSettingsFields />
		{/snippet}
	</EinstellungsAbschnitt>

	<!-- Haushalt -->
	<EinstellungsAbschnitt
		abschnitt={statisch(
			'haushalt',
			`Haushalt: ${workspaceState.workspace?.name ?? ''}`,
			'Wer dazugehört und was geteilt wird.'
		)}
		{suche}
		eigeneStichwoerter="Mitglieder Partner einladen"
	>
		{#snippet eigene()}
			<div class="flex flex-col gap-4 p-3">
				<MemberList members={workspaceState.members} />
				<InviteForm />
			</div>
		{/snippet}
	</EinstellungsAbschnitt>

	<!-- Konto & Daten -->
	<EinstellungsAbschnitt
		abschnitt={statisch('konto', 'Konto & Daten', 'Export, Löschen und Abmelden.')}
		{suche}
		eigeneStichwoerter="Export Daten Konto löschen abmelden"
	>
		{#snippet eigene()}
			<SettingRow label="Daten exportieren" hint="Lädt alle Bereiche als JSON herunter">
				<Button variant="secondary" onclick={() => downloadExport()}>Exportieren</Button>
			</SettingRow>

			<SettingRow label="Konto löschen" hint="Alle Daten werden unwiderruflich gelöscht">
				<Button variant="danger" onclick={() => (deleteAccountOpen = true)}>Löschen</Button>
			</SettingRow>

			<div class="p-2 pt-4">
				<Button variant="secondary" class="w-full" onclick={logout} loading={logoutState.loading}>
					{#snippet children()}
						{logoutState.loading ? 'Melde ab…' : 'Abmelden'}
					{/snippet}
				</Button>
			</div>
		{/snippet}
	</EinstellungsAbschnitt>

	<p class="pb-8 text-center text-xs text-text-3">
		Übungsdatenbank basiert auf <a href="https://wger.de" class="underline hover:text-text-2"
			>wger.de</a
		> (CC-BY-SA).
	</p>
</div>

<DeleteAccountSheet bind:open={deleteAccountOpen} />
