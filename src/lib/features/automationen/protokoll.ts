import type { ProtokollEintrag } from './types.js';

/** Lokal je Gerät: das Protokoll erklärt, was DIESES Gerät getan hat. Beim Abmelden gelöscht. */
export const PROTOKOLL_SCHLUESSEL = 'lifeos:automationen:protokoll:v1';
export const PROTOKOLL_MAX = 200;

const STATUS = new Set<ProtokollEintrag['status']>([
	'ausgefuehrt',
	'vorgeschlagen',
	'abgelehnt',
	'rueckgaengig',
	'ohne-wirkung',
	'fehler'
]);

function istEintrag(x: unknown): x is ProtokollEintrag {
	if (!x || typeof x !== 'object') return false;
	const e = x as Record<string, unknown>;
	return (
		typeof e.id === 'string' &&
		typeof e.zeit === 'string' &&
		typeof e.regelId === 'string' &&
		typeof e.regelTitel === 'string' &&
		typeof e.beschreibung === 'string' &&
		STATUS.has(e.status as ProtokollEintrag['status'])
	);
}

/** Neueste zuerst, höchstens PROTOKOLL_MAX Einträge. */
export function kappen(liste: ProtokollEintrag[]): ProtokollEintrag[] {
	return liste.slice(0, PROTOKOLL_MAX);
}

/** Liest das Protokoll. Kaputte oder fremde Daten ergeben eine leere Liste, nie einen Absturz. */
export function ladeProtokoll(): ProtokollEintrag[] {
	try {
		if (typeof localStorage === 'undefined') return [];
		const roh = JSON.parse(localStorage.getItem(PROTOKOLL_SCHLUESSEL) ?? '[]');
		return Array.isArray(roh) ? kappen(roh.filter(istEintrag)) : [];
	} catch {
		return [];
	}
}

export function speichereProtokoll(liste: ProtokollEintrag[]): void {
	try {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(PROTOKOLL_SCHLUESSEL, JSON.stringify(kappen(liste)));
	} catch {
		// Privatmodus/voller Speicher: das Protokoll gilt dann nur für diese Sitzung.
	}
}

export function loescheProtokoll(): void {
	try {
		if (typeof localStorage === 'undefined') return;
		localStorage.removeItem(PROTOKOLL_SCHLUESSEL);
	} catch {
		// nichts zu löschen
	}
}
