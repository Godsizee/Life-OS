/** ±40 Zeichen um den ersten Treffer, mit Auslassungszeichen. null ohne Treffer im Body. */
export function bodySnippet(body: string, query: string, radius = 40): string | null {
	const i = body.toLowerCase().indexOf(query.toLowerCase());
	if (i < 0) return null;
	const von = Math.max(0, i - radius);
	const bis = Math.min(body.length, i + query.length + radius);
	return `${von > 0 ? '…' : ''}${body.slice(von, bis).replace(/\s+/g, ' ')}${bis < body.length ? '…' : ''}`;
}
