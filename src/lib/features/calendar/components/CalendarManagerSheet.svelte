<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import { calendarState } from '../store.svelte';
	import { Trash2, Link as LinkIcon } from 'lucide-svelte';

	let {
		open = $bindable(false),
		hiddenCalendarIds = $bindable<string[]>([])
	} = $props();

	const CALENDAR_COLORS = [
		'#6366f1',
		'#0ea5e9',
		'#10b981',
		'#f59e0b',
		'#ef4444',
		'#a855f7',
		'#ec4899',
		'#64748b'
	];

	let newCalendarName = $state('');

	async function createCalendar() {
		if (!newCalendarName.trim()) return;
		await calendarState.addCalendar({ name: newCalendarName.trim(), color: CALENDAR_COLORS[0] });
		newCalendarName = '';
	}

	function toggleHidden(id: string) {
		if (hiddenCalendarIds.includes(id)) {
			hiddenCalendarIds = hiddenCalendarIds.filter(x => x !== id);
		} else {
			hiddenCalendarIds = [...hiddenCalendarIds, id];
		}
		localStorage.setItem('lifeos:calendar-hidden', JSON.stringify(hiddenCalendarIds));
	}

	async function removeCal(id: string) {
		try {
			await calendarState.removeCalendar(id);
		} catch (e: any) {
			alert(e.message);
		}
	}
</script>

<Sheet bind:open title="Kalender verwalten">
	<div class="flex flex-col gap-6">
		<div class="flex flex-col gap-4">
			{#each calendarState.calendars as cal (cal.id)}
				<div class="flex flex-col gap-2 rounded-xl border border-border-color bg-surface-0 p-3">
					<div class="flex items-center gap-3">
						<input
							type="checkbox"
							class="h-5 w-5 rounded text-primary-600 focus:ring-primary-500"
							checked={!hiddenCalendarIds.includes(cal.id)}
							onchange={() => toggleHidden(cal.id)}
							aria-label="Kalender einblenden"
						/>
						
						<div class="flex-1">
							<Input
								value={cal.name}
								onchange={(v) => calendarState.renameCalendar(cal.id, v.currentTarget.value)}
								class="!border-transparent !bg-transparent !p-0 !text-base font-semibold hover:!bg-surface-1 focus:!bg-surface-0"
							/>
						</div>
						
						<button
							class="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-surface-1 hover:text-red-500"
							aria-label="Löschen"
							onclick={() => removeCal(cal.id)}
							disabled={calendarState.calendars.length <= 1}
						>
							<Trash2 size={18} />
						</button>
					</div>

					<div class="flex items-center gap-2 pl-8">
						{#each CALENDAR_COLORS as c}
							<button
								class="h-6 w-6 rounded-full border-2 transition-all"
								class:border-surface-0={cal.color !== c}
								class:border-text-primary={cal.color === c || (!cal.color && c === CALENDAR_COLORS[0])}
								style="background-color: {c}"
								aria-label="Farbe {c}"
								onclick={() => calendarState.setCalendarColor(cal.id, c)}
							></button>
						{/each}
					</div>

					<div class="mt-2 pl-8">
						<div class="flex items-center gap-2">
							<LinkIcon size={14} class="text-text-tertiary" />
							<span class="text-xs font-medium uppercase tracking-wider text-text-tertiary">ICS-Abo (Nur Lesen)</span>
						</div>
						<Input
							placeholder="https://..."
							value={cal.ics_url || ''}
							onchange={(v) => calendarState.updateCalendarUrl(cal.id, v.currentTarget.value || null)}
							class="mt-1 !py-1 text-sm text-text-secondary"
						/>
						{#if cal.ics_last_synced_at}
							<p class="mt-1 text-xs text-text-tertiary">
								Zuletzt synchronisiert: {new Date(cal.ics_last_synced_at).toLocaleString('de-DE')}
							</p>
						{:else if cal.ics_url}
							<p class="mt-1 text-xs text-text-tertiary">
								Abgleich folgt demnächst...
							</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<div class="rounded-xl border border-border-color bg-surface-1 p-3">
			<span class="mb-2 block text-sm font-medium text-text-secondary">Neuer Kalender</span>
			<div class="flex items-center gap-2">
				<Input bind:value={newCalendarName} placeholder="Name..." class="flex-1" />
				<Button onclick={createCalendar} disabled={!newCalendarName.trim()}>Anlegen</Button>
			</div>
		</div>
	</div>
</Sheet>
