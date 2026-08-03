/**
 * UUID-Erzeugung mit Fallback.
 *
 * HINTERGRUND: `crypto.randomUUID()` existiert nur im Secure Context — also
 * unter https oder auf localhost. Beim Testen ueber die LAN-IP
 * (`http://192.168.x.x:5173`, genau der Weg aufs Handy) ist die Funktion
 * schlicht `undefined`: jedes Anlegen warf, jede Outbox-Mutation scheiterte.
 *
 * `crypto.getRandomValues()` ist dagegen ueberall verfuegbar. Der Fallback baut
 * daraus eine regulaere v4-UUID — die IDs sind in beiden Faellen ununterscheidbar
 * und bleiben als Primaerschluessel gueltig.
 */

const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

/** UUID v4 aus 16 Zufallsbytes. Setzt Version (4) und Variante (RFC 4122). */
function ausZufallsbytes(): string {
	const b = new Uint8Array(16);
	crypto.getRandomValues(b);
	b[6] = (b[6] & 0x0f) | 0x40;
	b[8] = (b[8] & 0x3f) | 0x80;
	return (
		HEX[b[0]] + HEX[b[1]] + HEX[b[2]] + HEX[b[3]] + '-' +
		HEX[b[4]] + HEX[b[5]] + '-' +
		HEX[b[6]] + HEX[b[7]] + '-' +
		HEX[b[8]] + HEX[b[9]] + '-' +
		HEX[b[10]] + HEX[b[11]] + HEX[b[12]] + HEX[b[13]] + HEX[b[14]] + HEX[b[15]]
	);
}

/** Neue UUID v4 — bevorzugt nativ, sonst aus `getRandomValues()`. */
export function neueId(): string {
	if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
	return ausZufallsbytes();
}
