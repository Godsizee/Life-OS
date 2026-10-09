import { wiederkehrTage, zuletztAktiv } from '#lib/config/heute.js';
import { toISODate } from '#lib/core/date.js';
import { setze, wert } from '#lib/core/einstellungen.js';
import { zeigeWillkommen } from './willkommen-kern.js';

class WillkommenState {
	/** Letzter aktiver Tag, wie er beim Start (oder beim Zurückkehren in die App) gespeichert war. */
	zuletzt = $state('');
	heute = $state(toISODate(new Date()));
	verborgen = $state(false);

	get sichtbar(): boolean {
		return !this.verborgen && zeigeWillkommen(this.zuletzt, this.heute, wert(wiederkehrTage));
	}

	/** Beim Start und wenn die App wieder sichtbar wird: Abwesenheit merken, dann „heute“ eintragen. */
	aufwachen(jetzt = new Date()): void {
		const heute = toISODate(jetzt);
		const gespeichert = wert(zuletztAktiv);
		if (gespeichert && gespeichert < heute) {
			this.zuletzt = gespeichert;
			this.heute = heute;
			this.verborgen = false;
		}
		void setze(zuletztAktiv, heute);
	}

	/** Beim Verlassen der App: letzten aktiven Tag festhalten. */
	schlafen(jetzt = new Date()): void {
		void setze(zuletztAktiv, toISODate(jetzt));
	}

	verbergen(): void {
		this.verborgen = true;
	}
}

export const willkommen = new WillkommenState();
