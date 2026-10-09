import { alternativen, deute, SICHERHEIT_MIN, type Deutung } from './erfassen.js';

/** Zustand eines Erfassen-Feldes: Text, Deutung und die vom Nutzer gewählte Art. */
export class ErfassenSitzung {
	text = $state('');
	/** Vom Nutzer umgeschaltete Art; `null` = die beste Deutung. */
	private wahl = $state<string | null>(null);

	private deutungen = $derived(deute(this.text));

	/** Alle Möglichkeiten für diesen Text, beste zuerst. */
	alle = $derived.by((): Deutung[] =>
		this.deutungen.length === 0
			? []
			: [this.deutungen[0], ...alternativen(this.text, this.deutungen)]
	);

	aktuell = $derived.by((): Deutung | null => {
		if (this.alle.length === 0) return null;
		return (this.wahl && this.alle.find((d) => d.art.id === this.wahl)) || this.alle[0];
	});

	/** „Stattdessen als:“ */
	andere = $derived(this.alle.filter((d) => d !== this.aktuell));

	/** Nichts Eindeutiges erkannt und der Nutzer hat noch nichts gewählt. */
	unsicher = $derived(
		this.aktuell !== null && this.wahl === null && this.aktuell.vorschau.sicherheit < SICHERHEIT_MIN
	);

	waehle(artId: string) {
		this.wahl = artId;
	}

	zuruecksetzen() {
		this.text = '';
		this.wahl = null;
	}

	/** Legt die aktuelle Deutung an und liefert die Erfolgsmeldung (oder `null`, wenn nichts zu tun war). */
	async ausfuehren(): Promise<string | null> {
		const d = this.aktuell;
		if (!d) return null;
		// Unsicher und ohne Wahl: Als Aufgabe ohne Angaben landet es im Eingang (`imEingang`).
		const imEingang = this.unsicher && d.art.id === 'aufgabe';
		const meldung = await d.art.ausfuehren(d.vorschau);
		this.zuruecksetzen();
		return imEingang ? 'Im Eingang abgelegt — später zuordnen.' : meldung;
	}
}
