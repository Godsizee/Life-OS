import { registriereSpeicher } from './einstellungen.js';

const SCHLUESSEL = 'lifeos:geraet:v1';

/** Einstellungen, die nur für dieses Gerät gelten (localStorage, nie auf dem Server). */
class GeraetEinstellungen {
	werte = $state<Record<string, unknown>>({});

	constructor() {
		if (typeof localStorage === 'undefined') return; // Vitest/Node
		try {
			this.werte = JSON.parse(localStorage.getItem(SCHLUESSEL) ?? '{}');
		} catch {
			this.werte = {};
		}
	}

	lesen(k: string): unknown {
		return this.werte[k];
	}

	async schreiben(patch: Record<string, unknown>): Promise<void> {
		this.werte = { ...this.werte, ...patch };
		try {
			localStorage.setItem(SCHLUESSEL, JSON.stringify(this.werte));
		} catch {
			// Privatmodus/voller Speicher: Wert gilt nur für diese Sitzung.
		}
	}
}

export const geraet = new GeraetEinstellungen();
registriereSpeicher('geraet', geraet);
