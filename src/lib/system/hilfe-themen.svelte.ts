import type { HilfeThema } from '#lib/core/modul.js';

/** Die Hilfetexte laden erst, wenn jemand sie braucht (Suche mit `?`), damit sie nicht im Start-Chunk liegen. */
let quelle = $state<(() => HilfeThema[]) | null>(null);

/** Alle Themen, sobald geladen; sonst `null` und der Ladevorgang beginnt. */
export function geladeneThemen(): HilfeThema[] | null {
	if (!quelle) {
		void import('./hilfe.js').then((m) => (quelle = m.alleThemen));
		return null;
	}
	return quelle();
}
