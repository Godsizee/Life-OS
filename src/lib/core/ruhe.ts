import * as z from 'zod/mini';
import { defineEinstellung, setze, wert } from './einstellungen.js';

/** Zeitraum ohne Pflichten: Routinen-Serien laufen darüber hinweg weiter (T603). Daten als 'yyyy-mm-dd'. */
export interface Pause {
	von: string;
	bis: string;
	grund: 'urlaub' | 'krank' | 'abwesend' | 'sonstiges';
}

const tag = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/));

export const ruhePausen = defineEinstellung<Pause[]>({
	schluessel: 'ruhe.pausen',
	ablage: 'nutzer',
	schema: z.array(
		z.object({
			von: tag,
			bis: tag,
			grund: z.enum(['urlaub', 'krank', 'abwesend', 'sonstiges'])
		})
	),
	standard: [],
	label: 'Pausen',
	hinweis: 'Während einer Pause bleiben Serien erhalten.',
	stufe: 'erweitert',
	abschnitt: 'ruhe',
	ui: { art: 'eigen' }
});

export const pausenListe = (): Pause[] => wert(ruhePausen);

export function istPausiert(datum: string, pausen: Pause[] = pausenListe()): boolean {
	return pausen.some((p) => p.von <= datum && datum <= p.bis);
}

/** Hängt eine Pause an; ein identischer Zeitraum wird nicht doppelt gespeichert. */
export async function fuegePauseHinzu(pause: Pause): Promise<void> {
	const alle = pausenListe();
	if (alle.some((p) => p.von === pause.von && p.bis === pause.bis)) return;
	await setze(ruhePausen, [...alle, pause]);
}

export async function entfernePause(pause: Pause): Promise<void> {
	await setze(
		ruhePausen,
		pausenListe().filter((p) => !(p.von === pause.von && p.bis === pause.bis))
	);
}
