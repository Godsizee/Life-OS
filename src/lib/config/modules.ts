import {
	Calendar,
	CheckSquare,
	Home,
	Notebook,
	Repeat,
	ShoppingCart,
	Target,
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
	{ id: 'dashboard', label: 'Heute', icon: Home, route: '/', plan: 'free' },
	{ id: 'tasks', label: 'Aufgaben', icon: CheckSquare, route: '/tasks', plan: 'free' },
	{ id: 'notes', label: 'Notizen', icon: Notebook, route: '/notes', plan: 'free' },
	{ id: 'habits', label: 'Routinen', icon: Repeat, route: '/habits', plan: 'free' },
	{ id: 'calendar', label: 'Kalender', icon: Calendar, route: '/calendar', plan: 'free' },
	{ id: 'shopping', label: 'Einkauf', icon: ShoppingCart, route: '/shopping', plan: 'free' },
	{ id: 'goals', label: 'Ziele', icon: Target, route: '/goals', plan: 'free' }
];
