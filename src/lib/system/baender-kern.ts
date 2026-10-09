/** Auswahl des Bands unter dem Seitenkopf. Rein, damit die Rangfolge testbar bleibt. */

export type BandAktion = 'laden' | 'erneut' | 'ansehen' | 'beenden';

export interface BandEingabe {
	updateVerfuegbar: boolean;
	online: boolean;
	syncStatus: 'idle' | 'syncing' | 'error';
	/** Wartende Änderungen in der Outbox. */
	wartend: number;
	/** Endgültig gescheiterte Änderungen. */
	unzustellbar: number;
	/** Text eines aktiven Modus, z. B. „MODUS: LEISER TAG · BIS 23:59“. Ohne Modus leer. */
	modus?: string | null;
}

export interface BandErgebnis {
	art: 'update' | 'offline' | 'sync-fehler' | 'unzustellbar' | 'sync' | 'modus';
	variante: 'update' | 'status' | 'fehler' | 'modus';
	text: string;
	aktion?: { art: BandAktion; label: string };
}

/** Rangfolge: Update > Offline > Sync-Fehler > Unzustellbares > Synchronisiert gerade > Modus. */
export function waehleBand(e: BandEingabe): BandErgebnis | null {
	const anzahl = e.wartend > 0 ? ` (${e.wartend})` : '';

	if (e.updateVerfuegbar) {
		return {
			art: 'update',
			variante: 'update',
			text: 'Neue Version von Life OS verfügbar.',
			aktion: { art: 'laden', label: 'Jetzt laden' }
		};
	}
	if (!e.online) {
		return {
			art: 'offline',
			variante: 'status',
			text: `OFFLINE — Änderungen werden auf diesem Gerät gesammelt${anzahl} und später übertragen.`
		};
	}
	if (e.syncStatus === 'error') {
		return {
			art: 'sync-fehler',
			variante: 'fehler',
			text: `Die Übertragung hat nicht geklappt${anzahl}. Die Änderungen bleiben auf diesem Gerät.`,
			aktion: { art: 'erneut', label: 'Erneut versuchen' }
		};
	}
	if (e.unzustellbar > 0) {
		const n = e.unzustellbar;
		return {
			art: 'unzustellbar',
			variante: 'fehler',
			text:
				n === 1
					? '1 Änderung konnte nicht gespeichert werden.'
					: `${n} Änderungen konnten nicht gespeichert werden.`,
			aktion: { art: 'ansehen', label: 'Ansehen' }
		};
	}
	if (e.syncStatus === 'syncing') {
		return { art: 'sync', variante: 'status', text: `Übertrage Änderungen${anzahl} …` };
	}
	if (e.modus) {
		return {
			art: 'modus',
			variante: 'modus',
			text: e.modus,
			aktion: { art: 'beenden', label: 'Beenden' }
		};
	}
	return null;
}
