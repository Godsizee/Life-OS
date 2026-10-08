import { toISODate } from '#lib/core/date.js';
import { attachmentsState } from '#lib/features/attachments/store.svelte.js';
import { linksState } from '#lib/features/links/store.svelte.js';
import { profileState } from '#lib/features/profile/store.svelte.js';
import { remindersState } from '#lib/features/reminders/store.svelte.js';
import { baueExport } from './export-kern.js';
import { MODULE } from './module.js';

/** Sammelt alle bereits geladenen Stores zu einem JSON-Dokument, ohne eigene Queries. */
export function buildExport(): string {
	return JSON.stringify(
		baueExport({
			profil: { display_name: profileState.displayName, settings: profileState.settings },
			dienste: {
				links: linksState.links,
				reminders: remindersState.reminders,
				attachments: attachmentsState.items
			},
			module: MODULE,
			jetzt: new Date()
		}),
		null,
		2
	);
}

export function downloadExport(): void {
	const blob = new Blob([buildExport()], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `life-os-export-${toISODate(new Date())}.json`;
	a.click();
	URL.revokeObjectURL(url);
}
