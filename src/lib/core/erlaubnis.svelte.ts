export type ErlaubnisArt = 'push' | 'timer';

type Antwort = NotificationPermission | 'nicht-unterstuetzt';

/**
 * Jede Anfrage nach Benachrichtigungen geht hier durch: Zuerst erklärt Life OS, wozu (Sheet
 * `ErlaubnisErklaerung`), erst nach „Erlauben“ fragt der Browser. Nur diese Datei ruft
 * `Notification.requestPermission()` auf.
 */
class ErlaubnisState {
	/** Gesetzt, solange die Erklärung offen ist. */
	art = $state<ErlaubnisArt | null>(null);
	private warten: ((a: Antwort) => void) | null = null;

	get unterstuetzt(): boolean {
		return typeof window !== 'undefined' && 'Notification' in window;
	}

	/** Liefert die Antwort des Browsers; ohne Nachfrage, wenn schon entschieden ist. */
	frageNach(art: ErlaubnisArt): Promise<Antwort> {
		if (!this.unterstuetzt) return Promise.resolve('nicht-unterstuetzt');
		if (Notification.permission !== 'default') return Promise.resolve(Notification.permission);
		this.warten?.(Notification.permission);
		this.art = art;
		return new Promise((resolve) => (this.warten = resolve));
	}

	/** „Erlauben“: erst jetzt fragt der Browser. */
	async bestaetige(): Promise<void> {
		const fertig = this.warten;
		this.warten = null;
		this.art = null;
		if (!fertig) return;
		try {
			fertig(await Notification.requestPermission());
		} catch {
			fertig(Notification.permission);
		}
	}

	/** „Nicht jetzt“: Der Browser wird nicht gefragt, die Entscheidung bleibt offen. */
	lehneAb(): void {
		const fertig = this.warten;
		this.warten = null;
		this.art = null;
		fertig?.(Notification.permission);
	}
}

export const erlaubnis = new ErlaubnisState();

/** iPhone und iPad liefern Benachrichtigungen nur in der installierten App. */
export function braucheInstallation(userAgent: string, installiert: boolean): boolean {
	return /iPhone|iPad|iPod/.test(userAgent) && !installiert;
}
