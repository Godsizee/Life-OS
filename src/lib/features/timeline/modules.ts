import {
	Calendar,
	CheckSquare,
	Dumbbell,
	Flame,
	Heart,
	Notebook,
	Smile,
	Target,
	Zap,
	CheckCircle,
	BookOpen,
	type Icon
} from 'lucide-svelte';
import type { TimelineModule } from './module-ids';

export interface TimelineModuleMeta {
	id: TimelineModule;
	label: string;
	icon: typeof Icon;
	color: string;
	bg: string;
}

export const TIMELINE_MODULES: TimelineModuleMeta[] = [
	{ id: 'tasks',    label: 'Aufgaben',   icon: CheckSquare, color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/20' },
	{ id: 'habits',   label: 'Routinen',   icon: Flame,       color: 'text-pink-500',    bg: 'bg-pink-50 dark:bg-pink-950/20' },
	{ id: 'notes',    label: 'Notizen',    icon: Notebook,    color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
	{ id: 'mood',     label: 'Stimmung',   icon: Smile,       color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/20' },
	{ id: 'goals',    label: 'Ziele',      icon: Target,      color: 'text-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
	{ id: 'checkins', label: 'Check-Ins',  icon: CheckCircle, color: 'text-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
	{ id: 'journal',  label: 'Tagebuch',   icon: BookOpen,    color: 'text-purple-400',  bg: 'bg-purple-50 dark:bg-purple-950/20' },
	{ id: 'health',   label: 'Gesundheit', icon: Heart,       color: 'text-cyan-500',    bg: 'bg-cyan-50 dark:bg-cyan-950/20' },
	{ id: 'fitness',  label: 'Fitness',    icon: Dumbbell,    color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-950/20' },
	{ id: 'calendar', label: 'Termine',    icon: Calendar,    color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-950/20' },
	{ id: 'focus',    label: 'Fokus',      icon: Zap,         color: 'text-yellow-500',  bg: 'bg-yellow-50 dark:bg-yellow-950/20' }
];
