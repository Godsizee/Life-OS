/**
 * Aktive Routine mit demselben Namen (Groß-/Kleinschreibung und Randleerzeichen egal).
 * Grundlage von `sys:aufgabe-routine-name`; ersetzt den Namensabgleich aus tasks/store.
 */
export function routineNachName<T extends { name: string; archived: boolean }>(
	routinen: T[],
	name: string
): T | undefined {
	const gesucht = name.trim().toLowerCase();
	if (!gesucht) return undefined;
	return routinen.find((r) => !r.archived && r.name.trim().toLowerCase() === gesucht);
}
