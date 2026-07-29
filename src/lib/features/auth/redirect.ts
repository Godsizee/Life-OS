/** Pfade, die nach dem Login kein sinnvolles Ziel sind — sonst dreht sich der Guard im Kreis. */
const LOOPING_PATHS = ['/login', '/register'];

/**
 * Steuerzeichen (inkl. Tab und Zeilenumbruch) entfernen Browser beim URL-Parsen
 * wieder — `/<TAB>/evil.tld` käme also als protokollrelative URL an und würde
 * die Prüfungen unten unterlaufen. Bewusst als Schleife statt Regex, damit die
 * Codepunkte lesbar bleiben.
 */
function hasControlChars(value: string): boolean {
	for (const char of value) {
		const code = char.codePointAt(0) ?? 0;
		if (code < 0x20 || code === 0x7f) return true;
	}
	return false;
}

/**
 * Validiert den `?next=`-Parameter zu einem eigenen, relativen Pfad.
 *
 * Ungeprüft übernommen wäre er ein Open Redirect: `?next=https://evil.tld` oder
 * das protokollrelative `?next=//evil.tld` schicken den frisch angemeldeten
 * Nutzer auf eine fremde Seite, die wie Life OS aussieht.
 */
export function safeNextPath(raw: string | null | undefined, fallback = '/'): string {
	if (!raw) return fallback;

	const value = raw.trim();
	if (!value.startsWith('/')) return fallback;
	// `//host` und `/\host` liest der Browser als protokollrelative URL.
	if (value[1] === '/' || value[1] === '\\') return fallback;
	if (hasControlChars(value)) return fallback;

	const path = value.split(/[?#]/)[0];
	if (LOOPING_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return fallback;

	return value;
}

/** Baut das Login-Ziel für den Auth-Guard, damit die ursprüngliche Route erhalten bleibt. */
export function loginUrlFor(pathname: string, search = ''): string {
	const next = safeNextPath(`${pathname}${search}`, '');
	return next ? `/login?next=${encodeURIComponent(next)}` : '/login';
}
