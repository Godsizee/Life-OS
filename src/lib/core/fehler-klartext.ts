/**
 * Übersetzt den Fehlercode einer nicht zustellbaren Änderung in einen Satz ohne Fachchinesisch.
 * Die Codes beschreibt `istDauerhaft` in `outbox.svelte.ts`. Unbekanntes bleibt neutral.
 */
export interface FehlerKlartext {
	/** Der Satz für die Person. */
	text: string;
	/** Ob der technische Text zusätzlich eingeklappt angeboten wird. */
	technischZeigen: boolean;
}

const TEXTE: Record<string, string> = {
	'23505': 'Gibt es schon — vermutlich auf einem anderen Gerät angelegt.',
	'23503': 'Der Bezug existiert nicht mehr — wurde wohl gelöscht.',
	'23502': 'Ein Pflichtfeld fehlt oder ein Wert ist ungültig.',
	'23514': 'Ein Pflichtfeld fehlt oder ein Wert ist ungültig.',
	'42501': 'Keine Berechtigung — z. B. privater Eintrag einer anderen Person.',
	PGRST204: 'App und Server passen nicht zusammen — App neu laden.'
};

export function fehlerKlartext(code: string | undefined): FehlerKlartext {
	const text = code ? TEXTE[code] : undefined;
	return text
		? { text, technischZeigen: false }
		: { text: 'Konnte nicht gespeichert werden.', technischZeigen: true };
}

/** Code des Fehlers (Postgres-SQLSTATE oder PostgREST-Code), falls vorhanden. */
export function fehlerCode(err: unknown): string | undefined {
	if (!err || typeof err !== 'object') return undefined;
	const code = (err as { code?: unknown }).code;
	return typeof code === 'string' && code ? code : undefined;
}
