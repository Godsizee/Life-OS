/** Überschrift des Rückblicks. Dient zugleich als Marker, damit er nur einmal pro Tag angehängt wird. */
export const RUECKBLICK_KOPF = '**Erledigt heute:**';

/**
 * Hängt die erledigten Aufgaben als Aufzählung an einen Tagebuchtext.
 * `null`, wenn es nichts anzuhängen gibt oder der Rückblick schon drinsteht (idempotent).
 */
export function rueckblickAnhaengen(body: string, aufgaben: string[]): string | null {
	if (body.includes(RUECKBLICK_KOPF)) return null;
	// Titel auf eine Zeile bringen, sonst bricht ein Zeilenumbruch die Aufzählung.
	const zeilen = aufgaben.map((a) => a.replace(/\s+/g, ' ').trim()).filter(Boolean);
	if (zeilen.length === 0) return null;
	const block = `${RUECKBLICK_KOPF}\n${zeilen.map((z) => `- ${z}`).join('\n')}`;
	return body.trim() ? `${body.replace(/\s+$/, '')}\n\n${block}` : block;
}
