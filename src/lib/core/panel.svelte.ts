/**
 * Ob gerade ein Kontext-Panel rechts offen ist. Das Layout schafft damit Platz
 * (`xl:pr-[440px]`), damit das Panel den Inhalt nicht verdeckt.
 * Mehrere Sheets können gleichzeitig Panels sein, deshalb wird gezählt.
 */
class PanelZustand {
	private anzahl = $state(0);

	get panelOffen(): boolean {
		return this.anzahl > 0;
	}

	/** Meldet ein offenes Panel an; der Rückgabewert meldet es wieder ab. */
	melde(): () => void {
		this.anzahl += 1;
		let aktiv = true;
		return () => {
			if (!aktiv) return;
			aktiv = false;
			this.anzahl = Math.max(0, this.anzahl - 1);
		};
	}
}

export const panel = new PanelZustand();
