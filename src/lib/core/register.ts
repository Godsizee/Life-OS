/**
 * Register-Muster gegen Zyklen (Zielbild C4): `core/` definiert das Register,
 * `system/start.ts` befüllt es aus den Manifesten, Features lesen es über `core/`.
 */
export function erstelleRegister<T>(name: string) {
	const eintraege = new Map<string, T>();
	return {
		setze(id: string, wert: T) {
			if (eintraege.has(id)) console.warn(`[register:${name}] überschreibe`, id);
			eintraege.set(id, wert);
		},
		hole: (id: string): T | undefined => eintraege.get(id),
		alle: (): T[] => [...eintraege.values()],
		leeren: () => eintraege.clear()
	};
}
