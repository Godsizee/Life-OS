import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Die Vorschlagsmaschine liest quer durch acht Stores. Statt sie alle zu laden,
 * steht hier ein schlanker Ersatz — so lässt sich jede Regel einzeln auslösen.
 * Die reinen Helfer (Streak, Ziel-Track, Wasser) bleiben echt, damit die Tests
 * nicht die Logik nachbauen, die sie prüfen sollen.
 */
const z = vi.hoisted(() => ({
	tasks: [] as any[],
	habits: [] as any[],
	habitDays: {} as Record<string, any[]>,
	healthEntries: [] as any[],
	todayHealth: null as any,
	goals: [] as any[],
	journalEntries: [] as any[],
	todayJournal: null as any,
	plans: [] as any[],
	logs: [] as any[],
	shoppingItems: [] as any[]
}));

vi.mock('$lib/features/tasks/store.svelte', () => ({
	tasksState: {
		get tasks() {
			return z.tasks;
		}
	}
}));
vi.mock('$lib/features/habits/store.svelte', () => ({
	habitsState: {
		get habits() {
			return z.habits;
		},
		entriesFor: (id: string) => z.habitDays[id] ?? [],
		toggleToday: vi.fn()
	}
}));
vi.mock('$lib/features/health/store.svelte', () => ({
	healthState: {
		get entries() {
			return z.healthEntries;
		},
		get todayEntry() {
			return z.todayHealth;
		},
		addWater: vi.fn()
	}
}));
vi.mock('$lib/features/goals/store.svelte', () => ({
	goalsState: {
		get goals() {
			return z.goals;
		},
		get journalEntries() {
			return z.journalEntries;
		},
		get todayEntry() {
			return z.todayJournal;
		}
	}
}));
vi.mock('$lib/features/fitness/store.svelte', () => ({
	fitnessState: {
		get plans() {
			return z.plans;
		},
		get logs() {
			return z.logs;
		},
		prFor: () => null
	}
}));
vi.mock('$lib/features/shopping/store.svelte', () => ({
	shoppingState: {
		get items() {
			return z.shoppingItems;
		}
	}
}));
vi.mock('$lib/features/profile/store.svelte', () => ({
	profileState: { glassSizeMl: 250 }
}));
vi.mock('$lib/features/analytics/store.svelte', () => ({
	analyticsState: { saveTodayScore: vi.fn() }
}));

const { getSuggestions } = await import('./engine');

function iso(tageZurueck: number): string {
	const d = new Date();
	d.setDate(d.getDate() - tageZurueck);
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const t = String(d.getDate()).padStart(2, '0');
	return `${d.getFullYear()}-${m}-${t}`;
}

/** Ausgangslage, in der KEINE Regel greift — jeder Test schaltet gezielt eine an. */
beforeEach(() => {
	z.tasks = [];
	z.habits = [];
	z.habitDays = {};
	z.healthEntries = [];
	z.todayHealth = { date: iso(0), water_ml: 2000, sleep_h: 8 };
	z.goals = [];
	z.journalEntries = [iso(1), iso(2), iso(3)].map((date) => ({ date, kind: 'daily' }));
	z.todayJournal = { date: iso(0) };
	z.plans = [];
	z.logs = [];
	z.shoppingItems = [];
});

function ids(): string[] {
	return getSuggestions().map((s) => s.id);
}

describe('Rahmen', () => {
	it('zeigt höchstens drei Vorschläge', () => {
		// Genug Auslöser für deutlich mehr als drei.
		z.tasks = [
			{ status: 'todo', due_at: new Date(Date.now() - 5 * 86400000).toISOString() },
			{ status: 'todo', due_at: new Date(Date.now() - 6 * 86400000).toISOString() }
		];
		z.healthEntries = [1, 2, 3].map((i) => ({ date: iso(i), sleep_h: 4 }));
		z.shoppingItems = Array.from({ length: 20 }, (_, i) => ({ id: `${i}`, checked: false }));
		z.todayHealth = { date: iso(0), water_ml: 0 };
		z.todayJournal = null;

		expect(getSuggestions().length).toBeLessThanOrEqual(3);
	});

	it('meldet ohne offene Punkte „alles im Griff"', () => {
		expect(ids()).toEqual(['perfect_day']);
	});

	it('vergibt eindeutige Kennungen', () => {
		z.shoppingItems = Array.from({ length: 20 }, (_, i) => ({ id: `${i}`, checked: false }));
		z.todayHealth = { date: iso(0), water_ml: 0 };
		const gefunden = ids();
		expect(new Set(gefunden).size).toBe(gefunden.length);
	});
});

describe('Überfällige Aufgaben', () => {
	const ueberfaellig = () => ({
		status: 'todo',
		due_at: new Date(Date.now() - 5 * 86400000).toISOString()
	});

	it('meldet ab zwei Aufgaben', () => {
		z.tasks = [ueberfaellig(), ueberfaellig()];
		expect(ids()).toContain('overdue_tasks');
	});

	it('schweigt bei einer einzelnen — dafür reicht die Liste selbst', () => {
		z.tasks = [ueberfaellig()];
		expect(ids()).not.toContain('overdue_tasks');
	});

	it('zählt erledigte nicht mit', () => {
		z.tasks = [{ ...ueberfaellig(), status: 'done' }, { ...ueberfaellig(), status: 'done' }];
		expect(ids()).not.toContain('overdue_tasks');
	});

	it('zählt knapp überfällige nicht mit', () => {
		const gestern = { status: 'todo', due_at: new Date(Date.now() - 86400000).toISOString() };
		z.tasks = [gestern, { ...gestern }];
		expect(ids()).not.toContain('overdue_tasks');
	});

	it('ignoriert Aufgaben ohne Fälligkeit', () => {
		z.tasks = [
			{ status: 'todo', due_at: null },
			{ status: 'todo', due_at: null }
		];
		expect(ids()).not.toContain('overdue_tasks');
	});
});

describe('Schlafdefizit', () => {
	it('meldet ab drei kurzen Nächten der letzten fünf Einträge', () => {
		z.healthEntries = [
			{ date: iso(1), sleep_h: 5 },
			{ date: iso(2), sleep_h: 5.5 },
			{ date: iso(3), sleep_h: 4 },
			{ date: iso(4), sleep_h: 8 }
		];
		expect(ids()).toContain('sleep_deficit');
	});

	it('schweigt bei zwei kurzen Nächten', () => {
		z.healthEntries = [
			{ date: iso(1), sleep_h: 5 },
			{ date: iso(2), sleep_h: 5 },
			{ date: iso(3), sleep_h: 8 }
		];
		expect(ids()).not.toContain('sleep_deficit');
	});

	it('behandelt fehlende Angaben nicht als kurze Nacht', () => {
		z.healthEntries = [1, 2, 3].map((i) => ({ date: iso(i), sleep_h: null }));
		expect(ids()).not.toContain('sleep_deficit');
	});
});

describe('Wasser', () => {
	it('erinnert, wenn heute noch nichts eingetragen ist', () => {
		z.todayHealth = { date: iso(0), water_ml: 0 };
		expect(ids()).toContain('drink_water');
	});

	it('erinnert auch ganz ohne Eintrag für heute', () => {
		z.todayHealth = null;
		expect(ids()).toContain('drink_water');
	});

	it('schweigt, sobald etwas eingetragen ist', () => {
		z.todayHealth = { date: iso(0), water_ml: 250 };
		expect(ids()).not.toContain('drink_water');
	});
});

describe('Einkaufsliste', () => {
	it('meldet erst über zwölf offenen Posten', () => {
		z.shoppingItems = Array.from({ length: 13 }, (_, i) => ({ id: `${i}`, checked: false }));
		expect(ids()).toContain('shopping_full');
	});

	it('schweigt bei genau zwölf', () => {
		z.shoppingItems = Array.from({ length: 12 }, (_, i) => ({ id: `${i}`, checked: false }));
		expect(ids()).not.toContain('shopping_full');
	});

	it('zählt abgehakte Posten nicht mit', () => {
		z.shoppingItems = Array.from({ length: 20 }, (_, i) => ({ id: `${i}`, checked: true }));
		expect(ids()).not.toContain('shopping_full');
	});
});

describe('Training', () => {
	it('erinnert, wenn Pläne da sind, aber lange kein Training lief', () => {
		z.plans = [{ id: 'p1' }];
		z.logs = [{ date: iso(9) }];
		expect(ids()).toContain('workout_due');
	});

	it('erinnert auch, wenn es noch gar kein Training gab', () => {
		z.plans = [{ id: 'p1' }];
		z.logs = [];
		expect(ids()).toContain('workout_due');
	});

	it('schweigt nach einem frischen Training', () => {
		z.plans = [{ id: 'p1' }];
		z.logs = [{ date: iso(1) }];
		expect(ids()).not.toContain('workout_due');
	});

	it('schweigt ohne Trainingsplan — sonst wäre es eine Aufforderung ins Leere', () => {
		z.plans = [];
		z.logs = [];
		expect(ids()).not.toContain('workout_due');
	});
});

describe('Tagebuch', () => {
	it('fragt nach dem Tag, solange heute nichts steht', () => {
		z.todayJournal = null;
		expect(ids()).toContain('journal_today');
	});

	it('schweigt, sobald der heutige Eintrag da ist', () => {
		expect(ids()).not.toContain('journal_today');
	});

	it('mahnt nach drei leeren Tagen', () => {
		z.journalEntries = [];
		z.todayJournal = { date: iso(0) };
		expect(ids()).toContain('journal_missing');
	});

	it('zählt Wochenrückblicke nicht als Tageseintrag', () => {
		z.journalEntries = [iso(1), iso(2), iso(3)].map((date) => ({ date, kind: 'weekly' }));
		z.todayJournal = { date: iso(0) };
		expect(ids()).toContain('journal_missing');
	});
});

describe('Streak in Gefahr', () => {
	const taeglich = {
		id: 'h1',
		name: 'Lesen',
		archived: false,
		schedule: { type: 'daily' as const },
		target_value: null,
		unit: null
	};

	/** Häkchen an den letzten `n` Tagen — heute bewusst offen. */
	function serie(n: number) {
		return Array.from({ length: n }, (_, i) => ({
			date: iso(i + 1),
			value: 1,
			status: 'done' as const
		}));
	}

	it('warnt, wenn eine laufende Serie heute noch offen ist', () => {
		z.habits = [taeglich];
		z.habitDays = { h1: serie(5) };
		expect(ids()).toContain('streak_h1');
	});

	it('schweigt, wenn heute schon abgehakt ist', () => {
		z.habits = [taeglich];
		z.habitDays = { h1: [{ date: iso(0), value: 1, status: 'done' }, ...serie(5)] };
		expect(ids()).not.toContain('streak_h1');
	});

	it('schweigt ohne laufende Serie — da ist nichts zu verlieren', () => {
		z.habits = [taeglich];
		z.habitDays = { h1: [] };
		expect(ids()).not.toContain('streak_h1');
	});

	it('lässt archivierte Routinen aus', () => {
		z.habits = [{ ...taeglich, archived: true }];
		z.habitDays = { h1: serie(5) };
		expect(ids()).not.toContain('streak_h1');
	});
});

describe('Stagnierende Ziele', () => {
	it('meldet ein Ziel ohne Bewegung seit zwei Wochen', () => {
		z.goals = [
			{
				id: 'g1',
				title: 'Marathon',
				status: 'open',
				progress: 10,
				updated_at: new Date(Date.now() - 20 * 86400000).toISOString()
			}
		];
		expect(ids().some((id) => id.startsWith('stagnating_'))).toBe(true);
	});

	it('schweigt bei frisch angefasstem Ziel', () => {
		z.goals = [
			{
				id: 'g1',
				title: 'Marathon',
				status: 'open',
				progress: 10,
				updated_at: new Date().toISOString()
			}
		];
		expect(ids().some((id) => id.startsWith('stagnating_'))).toBe(false);
	});
});
