/**
 * Entladen aller Workspace-Daten beim Abmelden bzw. Konto-Löschen.
 *
 * Register statt Import (Zielbild C4): Das Entladen lebt in `system/daten.ts`, die
 * alle Manifeste kennt. Features (Logout, Konto löschen) dürfen `system/` nicht
 * importieren — `system/start.ts` hinterlegt die Funktion deshalb hier.
 */
let entladen: (() => void) | null = null;

export function setzeEntladen(fn: (() => void) | null): void {
	entladen = fn;
}

export function entladeSitzung(): void {
	entladen?.();
}
