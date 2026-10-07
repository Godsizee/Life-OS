import {
	BookOpen,
	Calendar,
	CheckSquare,
	ClipboardList,
	Dumbbell,
	Heart,
	History,
	Home,
	Notebook,
	Repeat,
	ShoppingCart,
	SmilePlus,
	Target,
	TrendingUp,
	Zap
} from '@lucide/svelte';
import type { IconKomponente } from '#lib/ui/icon.js';

export type ModulId =
	| 'dashboard'
	| 'tasks'
	| 'notes'
	| 'habits'
	| 'calendar'
	| 'shopping'
	| 'goals'
	| 'journal'
	| 'focus'
	| 'review'
	| 'mood'
	| 'health'
	| 'fitness'
	| 'analytics'
	| 'timeline';

export type Bereich = 'heute' | 'planen' | 'machen' | 'reflektieren' | 'wissen';
export type SetupAbsicht =
	'tag-planen' | 'befinden' | 'routinen' | 'haushalt' | 'fitness' | 'wissen';

export interface ModulMeta {
	id: ModulId;
	label: string;
	icon: IconKomponente;
	route: string;
	bereich: Bereich;
	/** EIN Satz: wofür ist das Modul da? (Modul-Blatt, Setup, Hilfe, Suche) */
	kurz: string;
	/** Token-Name der Modulfarbe — immer `--mod-<id>`. */
	farbe: `--mod-${ModulId}`;
	/** Setup-Absichten, die dieses Modul einschalten. */
	absichten: SetupAbsicht[];
	standardAktiv: boolean;
	/** true = nicht abschaltbar. */
	pflicht?: boolean;
	plan: 'free' | 'paid';
	/** Quelle für die Zusammenspiel-Seite /hilfe/zusammenspiel. */
	zusammenspiel?: { mit: ModulId; wie: string }[];
}

export const modules: ModulMeta[] = [
	{
		id: 'dashboard',
		label: 'Heute',
		icon: Home,
		route: '/',
		bereich: 'heute',
		kurz: 'Zeigt, was jetzt zählt: Termine, Geplantes, Routinen und ein Check-in.',
		farbe: '--mod-dashboard',
		absichten: [],
		standardAktiv: true,
		pflicht: true,
		plan: 'free'
	},
	{
		id: 'tasks',
		label: 'Aufgaben',
		icon: CheckSquare,
		route: '/tasks',
		bereich: 'planen',
		kurz: 'Hält fest, was zu tun ist, mit Eingang, Plan für heute und Fristen.',
		farbe: '--mod-tasks',
		absichten: ['tag-planen', 'haushalt'],
		standardAktiv: true,
		plan: 'free'
	},
	{
		id: 'notes',
		label: 'Notizen',
		icon: Notebook,
		route: '/notes',
		bereich: 'wissen',
		kurz: 'Notizen, Checklisten und Ideen, privat oder geteilt.',
		farbe: '--mod-notes',
		absichten: ['wissen', 'haushalt'],
		standardAktiv: true,
		plan: 'free'
	},
	{
		id: 'habits',
		label: 'Routinen',
		icon: Repeat,
		route: '/habits',
		bereich: 'planen',
		kurz: 'Wiederkehrendes, das du aufbauen willst, mit Pausen statt Strafen.',
		farbe: '--mod-habits',
		absichten: ['routinen'],
		standardAktiv: true,
		plan: 'free'
	},
	{
		id: 'calendar',
		label: 'Kalender',
		icon: Calendar,
		route: '/calendar',
		bereich: 'planen',
		kurz: 'Termine und Serien, auch abonnierte Kalender (ICS).',
		farbe: '--mod-calendar',
		absichten: ['tag-planen', 'haushalt'],
		standardAktiv: true,
		plan: 'free'
	},
	{
		id: 'shopping',
		label: 'Einkauf',
		icon: ShoppingCart,
		route: '/shopping',
		bereich: 'planen',
		kurz: 'Gemeinsame Einkaufslisten in Echtzeit.',
		farbe: '--mod-shopping',
		absichten: ['haushalt'],
		standardAktiv: true,
		plan: 'free'
	},
	{
		id: 'goals',
		label: 'Ziele',
		icon: Target,
		route: '/goals',
		bereich: 'planen',
		kurz: 'Größere Vorhaben mit Fortschritt. Aufgaben und Routinen zahlen darauf ein.',
		farbe: '--mod-goals',
		absichten: ['routinen', 'fitness'],
		standardAktiv: true,
		plan: 'free'
	},
	{
		id: 'journal',
		label: 'Tagebuch',
		icon: BookOpen,
		route: '/journal',
		bereich: 'reflektieren',
		kurz: 'Private Gedanken zum Tag, nur für dich sichtbar.',
		farbe: '--mod-journal',
		absichten: ['befinden'],
		standardAktiv: true,
		plan: 'free'
	},
	{
		id: 'focus',
		label: 'Fokus',
		icon: Zap,
		route: '/focus',
		bereich: 'machen',
		kurz: 'Konzentriert arbeiten in Runden. Die Zeit wird gebucht.',
		farbe: '--mod-focus',
		absichten: ['tag-planen'],
		standardAktiv: true,
		plan: 'free'
	},
	{
		id: 'review',
		label: 'Wochenrückblick',
		icon: ClipboardList,
		route: '/review',
		bereich: 'reflektieren',
		kurz: 'Einmal pro Woche: Rückblick, Reflexion, Fokus für die nächste Woche.',
		farbe: '--mod-review',
		absichten: ['tag-planen', 'routinen'],
		standardAktiv: true,
		plan: 'free'
	},
	{
		id: 'mood',
		label: 'Stimmung',
		icon: SmilePlus,
		route: '/mood',
		bereich: 'reflektieren',
		kurz: 'Wie du dich fühlst, mehrmals am Tag möglich, mit Aktivitäten.',
		farbe: '--mod-mood',
		absichten: ['befinden'],
		standardAktiv: true,
		plan: 'free'
	},
	{
		id: 'health',
		label: 'Gesundheit',
		icon: Heart,
		route: '/health',
		bereich: 'reflektieren',
		kurz: 'Schlaf, Wasser, Gewicht, Energie, gemessen an deinen Zielen.',
		farbe: '--mod-health',
		absichten: ['befinden', 'fitness'],
		standardAktiv: false,
		plan: 'free'
	},
	{
		id: 'fitness',
		label: 'Training',
		icon: Dumbbell,
		route: '/fitness',
		bereich: 'machen',
		kurz: 'Trainingspläne, Live-Workout, Rekorde.',
		farbe: '--mod-fitness',
		absichten: ['fitness'],
		standardAktiv: false,
		plan: 'free'
	},
	{
		id: 'analytics',
		label: 'Einblicke',
		icon: TrendingUp,
		route: '/analytics',
		bereich: 'reflektieren',
		kurz: 'Muster und Zusammenhänge, mit offengelegter Rechnung.',
		farbe: '--mod-analytics',
		absichten: ['befinden'],
		standardAktiv: false,
		plan: 'free'
	},
	{
		id: 'timeline',
		label: 'Verlauf',
		icon: History,
		route: '/timeline',
		bereich: 'reflektieren',
		kurz: 'Alles, was passiert ist, chronologisch und filterbar.',
		farbe: '--mod-timeline',
		absichten: [],
		standardAktiv: true,
		plan: 'free'
	}
];

/** Standard-Tabs der mobilen Leiste — Rückfall, wenn eine Wahl ungültig/deaktiviert ist. */
export const bottomNavModuleIds = [
	'dashboard',
	'tasks',
	'calendar',
	'notes'
] as const satisfies readonly ModulId[];
