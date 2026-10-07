/**
 * Offene Bitte, die Stimmung festzuhalten — gesetzt von der Aktion `mood.checkinAnbieten`
 * (z. B. nach einem Training). Nur im Speicher: sie ist ein Angebot, kein Datensatz.
 */
class CheckinAnfrage {
	anlass = $state<string | null>(null);

	setze(anlass: string): void {
		this.anlass = anlass;
	}

	loesche(): void {
		this.anlass = null;
	}
}

export const checkinAnfrage = new CheckinAnfrage();
