/**
 * Zustand des Willkommens-Hinweises auf dem Dashboard.
 *
 * Versioniert im Schlüssel: Nach größeren Änderungen an Life OS lässt sich der
 * Hinweis mit `v2` erneut ausspielen, ohne dass alte Einträge im Weg stehen.
 */
export const WELCOME_STORAGE_KEY = 'lifeos:welcome:v1';

export function hasSeenWelcome(): boolean {
	try {
		return localStorage.getItem(WELCOME_STORAGE_KEY) === '1';
	} catch {
		// Privater Modus o. Ä. — lieber einmal zu viel zeigen als zu scheitern.
		return false;
	}
}

export function markWelcomeSeen(): void {
	try {
		localStorage.setItem(WELCOME_STORAGE_KEY, '1');
	} catch {}
}

/** Macht den weggeklickten Hinweis wieder sichtbar (Einstiegspunkt in `/more`). */
export function resetWelcome(): void {
	try {
		localStorage.removeItem(WELCOME_STORAGE_KEY);
	} catch {}
}
