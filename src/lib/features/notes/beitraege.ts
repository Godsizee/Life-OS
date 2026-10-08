import { Notebook } from '@lucide/svelte';
import { toISODate } from '#lib/core/date.js';
import type { ModulManifest } from '#lib/core/modul.js';
import { sucheIn } from '#lib/core/suche.js';
import { notesState } from './store.svelte.js';
import { notizenVerlauf } from './timeline.js';

export const notizenBeitraege: Pick<
	ModulManifest,
	'suche' | 'verknuepfbar' | 'timeline' | 'export'
> = {
	suche: (anfrage) =>
		sucheIn(
			notesState.notes,
			anfrage,
			(n) => n.title,
			(n, gewicht) => ({
				id: n.id,
				modul: 'notes',
				titel: n.title,
				untertitel: n.private ? 'Privat' : undefined,
				href: `/notes?note=${n.id}`,
				gewicht
			})
		),
	verknuepfbar: [
		{
			typ: 'note',
			label: 'Notiz',
			icon: Notebook,
			href: (id) => `/notes?note=${id}`,
			alle: () => notesState.notes.map((n) => ({ id: n.id, titel: n.title }))
		}
	],
	timeline: (von, bis) => notizenVerlauf(notesState.notes, toISODate(von), toISODate(bis)),
	export: () => ({ notes: notesState.notes })
};
