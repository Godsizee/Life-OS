// Ersetzt die versteckte Namens-Heuristik aus fitness/integration.ts (T205). Rein, ohne Store.
const TRAINING_KEYWORDS =
	/(training|workout|sport|gym|fitness|kraft|übung|uebung|laufen|joggen|cardio|bewegung)/i;

export function istTrainingsName(name: string): boolean {
	return TRAINING_KEYWORDS.test(name);
}

interface RoutineKern {
	id: string;
	name: string;
	archived: boolean;
	goal_id?: string | null;
}
interface ZielKern {
	id: string;
	goal_type: string;
}

/**
 * Einmalige Einrichtung von `sys:training-routine` für Bestandsnutzer (Zielbild C7):
 * Genau EINE aktive Routine, deren Name nach Training klingt oder die an ein
 * Häufigkeitsziel (`fitness_frequency`) gekoppelt ist. Bei zwei oder mehr Kandidaten
 * wird nichts geraten — die Auswahl trifft der Nutzer in den Verknüpfungen.
 */
export function findeTrainingsRoutine(
	routinen: RoutineKern[],
	ziele: ZielKern[]
): { routine: RoutineKern; grund: 'ziel' | 'name' } | null {
	const frequenzZiele = new Set(
		ziele.filter((z) => z.goal_type === 'fitness_frequency').map((z) => z.id)
	);
	const kandidaten = routinen.filter(
		(r) => !r.archived && ((r.goal_id && frequenzZiele.has(r.goal_id)) || istTrainingsName(r.name))
	);
	if (kandidaten.length !== 1) return null;
	const routine = kandidaten[0];
	const ueberZiel = !!routine.goal_id && frequenzZiele.has(routine.goal_id);
	return { routine, grund: ueberZiel ? 'ziel' : 'name' };
}
