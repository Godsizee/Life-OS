import { env } from '$env/dynamic/public';

/**
 * Passkeys hängen an zwei Bedingungen, die beide zur Laufzeit gelten müssen:
 * der Browser muss WebAuthn können UND der GoTrue-Container muss die
 * Passkey-Endpunkte kennen. Der selbst gehostete Auth-Server dieses Projekts
 * antwortet aktuell mit 404 — er ist schlicht zu alt (siehe HANDOFF.md).
 *
 * Deshalb wird die Fähigkeit geprüft statt angenommen: Sobald der Container
 * aktualisiert ist, schaltet sich der Passkey-Weg ohne Code-Änderung frei.
 */

const CACHE_KEY = 'lifeos:auth:passkey-server';

let inFlight: Promise<boolean> | null = null;

export function passkeySupportedByBrowser(): boolean {
	return typeof window !== 'undefined' && typeof window.PublicKeyCredential === 'function';
}

function readCache(): boolean | null {
	try {
		const raw = sessionStorage.getItem(CACHE_KEY);
		return raw === null ? null : raw === 'true';
	} catch {
		return null;
	}
}

function writeCache(value: boolean): void {
	try {
		sessionStorage.setItem(CACHE_KEY, String(value));
	} catch {
		// Privater Modus o. Ä. — dann wird eben je Seitenaufruf einmal geprüft.
	}
}

async function probeServer(): Promise<boolean> {
	const url = env.VITE_SUPABASE_URL;
	const key = env.VITE_SUPABASE_ANON_KEY;
	if (!url || !key) return false;

	try {
		// Leerer Body mit Absicht: kennt der Server den Endpunkt, beanstandet er
		// die Eingabe (400/422); kennt er ihn nicht, kommt 404. Genau das ist die
		// Unterscheidung, auf die es ankommt.
		const response = await fetch(`${url}/auth/v1/passkeys/authentication/options`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', apikey: key },
			body: '{}'
		});
		return response.status !== 404;
	} catch {
		// Netzwerkfehler heißt nicht "nicht unterstützt" — aber der Passwort-Weg
		// funktioniert in jedem Fall, also hier bewusst konservativ.
		return false;
	}
}

/**
 * Ergebnis wird für die Sitzung gecacht: Die Serverfähigkeit ändert sich nur
 * beim Container-Update, und Login-Seiten werden oft mehrfach gerendert.
 */
export async function passkeyAvailable(): Promise<boolean> {
	if (!passkeySupportedByBrowser()) return false;

	const cached = readCache();
	if (cached !== null) return cached;

	inFlight ??= probeServer().then((result) => {
		writeCache(result);
		inFlight = null;
		return result;
	});

	return inFlight;
}
