/**
 * Wohin die `?`-Taste im Seitenkopf führt. `ui/` kennt `system/` nicht, deshalb trägt
 * `system/start.ts` die Quelle ein (gleiches Register-Muster wie bei Aktionen und Score).
 */
type HilfeQuelle = (pfad: string) => string;

let quelle: HilfeQuelle | null = null;

export function setzeHilfeQuelle(f: HilfeQuelle): void {
	quelle = f;
}

/** Link zur Hilfe der Seite unter `pfad`, oder `null`, solange keine Quelle eingetragen ist. */
export function hilfeHref(pfad: string): string | null {
	return quelle ? quelle(pfad) : null;
}
