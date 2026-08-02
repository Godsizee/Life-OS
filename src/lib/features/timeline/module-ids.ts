export const TIMELINE_MODULE_IDS = [
	'tasks',
	'habits',
	'notes',
	'mood',
	'goals',
	'health',
	'fitness',
	'calendar',
	'focus',
	'checkins',
	'journal'
] as const;

export type TimelineModule = typeof TIMELINE_MODULE_IDS[number];
