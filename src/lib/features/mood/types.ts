export interface MoodEntry {
	id: string;
	workspace_id: string;
	user_id: string;
	date: string;
	score: 1 | 2 | 3 | 4 | 5;
	note: string | null;
}

// Emojis kept for legacy tooltip/title fallback only
export const MOOD_EMOJIS: Record<number, string> = {
	1: '😞',
	2: '😕',
	3: '😐',
	4: '🙂',
	5: '😄'
};

export const MOOD_LABELS: Record<number, string> = {
	1: 'Schlecht',
	2: 'Nicht so gut',
	3: 'Okay',
	4: 'Gut',
	5: 'Großartig'
};
