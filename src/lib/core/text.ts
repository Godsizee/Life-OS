/** ±40 Zeichen um den ersten Treffer, mit Auslassungszeichen. null ohne Treffer im Body. */
export function bodySnippet(body: string, query: string, radius = 40): string | null {
	const i = body.toLowerCase().indexOf(query.toLowerCase());
	if (i < 0) return null;
	const von = Math.max(0, i - radius);
	const bis = Math.min(body.length, i + query.length + radius);
	return `${von > 0 ? '…' : ''}${body.slice(von, bis).replace(/\s+/g, ' ')}${bis < body.length ? '…' : ''}`;
}

/**
 * Wie gut passt `q` auf `text`? 0 = gar nicht, sonst 0..1 (für `SuchTreffer.gewicht`).
 * Anfang > Wortanfang > Teilstring > verstreute Buchstaben (erst ab 3 Zeichen, sonst zu viel Rauschen).
 */
export function passung(text: string, q: string): number {
	const t = text.toLowerCase();
	const s = q.trim().toLowerCase();
	if (!s) return 0.5;
	if (t.startsWith(s)) return 1;
	if (t.includes(` ${s}`) || t.includes(`-${s}`)) return 0.8;
	if (t.includes(s)) return 0.6;
	if (s.length < 3) return 0;
	let i = 0;
	for (let k = 0; k < t.length && i < s.length; k++) if (t[k] === s[i]) i++;
	return i === s.length ? 0.3 : 0;
}
