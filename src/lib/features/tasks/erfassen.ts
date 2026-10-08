import { formatDauer, formatTagKurz, formatUhr, fromISODate } from '#lib/core/date.js';
import type { ErfassenArt, ErfassenVorschau } from '#lib/core/modul.js';
import { parseTaskInput, type ParsedTaskInput } from './quick-add.js';
import { tasksState } from './store.svelte.js';

const PRIO_LABEL = { high: 'Hoch', medium: 'Mittel', low: 'Niedrig' } as const;

function vorschau(p: ParsedTaskInput, sicherheit: number): ErfassenVorschau {
	const felder: ErfassenVorschau['felder'] = [{ label: 'Titel', wert: p.title }];
	if (p.planned_for) {
		const tag = fromISODate(p.planned_for);
		const zeit = p.scheduled_start ? ` · ${formatUhr(new Date(p.scheduled_start))}` : '';
		felder.push({ label: 'Geplant', wert: `${tag ? formatTagKurz(tag) : p.planned_for}${zeit}` });
	}
	if (p.due_at) {
		const d = new Date(p.due_at);
		felder.push({ label: 'Frist', wert: `${formatTagKurz(d)} · ${formatUhr(d)}` });
	}
	if (p.estimate_min) felder.push({ label: 'Dauer', wert: formatDauer(p.estimate_min) });
	if (p.priority !== 'medium') felder.push({ label: 'Prio', wert: PRIO_LABEL[p.priority] });
	if (p.project_name) felder.push({ label: 'Projekt', wert: p.project_name });
	if (p.labels.length) felder.push({ label: 'Labels', wert: p.labels.join(', ') });
	if (p.rrule)
		felder.push({ label: 'Wiederholt', wert: p.rrule.replace('FREQ=', '').toLowerCase() });
	return { art: 'Aufgabe', felder, sicherheit, daten: p };
}

/** Sobald ein Zusatz erkannt wurde, ist es eindeutig eine Aufgabe; reiner Text ist nur der Rückfall. */
const hatZusatz = (p: ParsedTaskInput) =>
	!!(
		p.planned_for ||
		p.due_at ||
		p.estimate_min ||
		p.project_name ||
		p.labels.length ||
		p.rrule ||
		p.priority !== 'medium'
	);

export const aufgabeErfassen: ErfassenArt = {
	id: 'aufgabe',
	label: 'Aufgabe',
	rang: 70,
	beispiele: ['Steuer machen morgen 30min bis Freitag', 'Angebot schreiben #Arbeit !hoch'],
	erkennen(text) {
		const p = parseTaskInput(text);
		return vorschau(p, hatZusatz(p) ? 0.7 : 0.3);
	},
	erzwinge: (text) => vorschau(parseTaskInput(text), 0.7),
	async ausfuehren(v) {
		const p = v.daten as ParsedTaskInput;
		const projekt = p.project_name
			? tasksState.projects.find(
					(x) => !x.archived && x.name.toLowerCase() === p.project_name!.toLowerCase()
				)
			: undefined;
		await tasksState.addTask({
			title: p.title,
			priority: p.priority,
			due_at: p.due_at,
			planned_for: p.planned_for,
			estimate_min: p.estimate_min,
			scheduled_start: p.scheduled_start,
			labels: p.labels,
			rrule: p.rrule,
			project_id: projekt?.id ?? null
		});
		return 'Aufgabe hinzugefügt';
	}
};
