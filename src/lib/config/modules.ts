import {
	Calendar,
	CheckSquare,
	ClipboardList,
	Heart,
	Home,
	Notebook,
	Repeat,
	ShoppingCart,
	SmilePlus,
	Target,
	Zap,
	Dumbbell,
	TrendingUp,
	History,
	type Icon
} from 'lucide-svelte';

export interface ModuleConfig {
	id: string;
	label: string;
	icon: typeof Icon;
	route: string;
	plan: 'free' | 'paid';
}

export const modules: ModuleConfig[] = [
	{ id: 'dashboard', label: 'Heute',     icon: Home,          route: '/',         plan: 'free' },
	{ id: 'tasks',     label: 'Aufgaben',  icon: CheckSquare,   route: '/tasks',     plan: 'free' },
	{ id: 'notes',     label: 'Notizen',   icon: Notebook,      route: '/notes',     plan: 'free' },
	{ id: 'habits',    label: 'Routinen',  icon: Repeat,        route: '/habits',    plan: 'free' },
	{ id: 'calendar',  label: 'Kalender',  icon: Calendar,      route: '/calendar',  plan: 'free' },
	{ id: 'shopping',  label: 'Einkauf',   icon: ShoppingCart,  route: '/shopping',  plan: 'free' },
	{ id: 'goals',     label: 'Ziele',     icon: Target,        route: '/goals',     plan: 'free' },
	{ id: 'focus',     label: 'Fokus',     icon: Zap,           route: '/focus',     plan: 'free' },
	{ id: 'review',    label: 'Review',    icon: ClipboardList, route: '/review',    plan: 'free' },
	{ id: 'mood',      label: 'Stimmung',  icon: SmilePlus,     route: '/mood',      plan: 'free' },
	{ id: 'health',    label: 'Gesundheit',icon: Heart,         route: '/health',    plan: 'free' },
	{ id: 'fitness',   label: 'Fitness',   icon: Dumbbell,      route: '/fitness',   plan: 'free' },
	{ id: 'analytics', label: 'Analytics', icon: TrendingUp,    route: '/analytics', plan: 'free' },
	{ id: 'timeline',  label: 'Timeline',  icon: History,       route: '/timeline',  plan: 'free' }
];

