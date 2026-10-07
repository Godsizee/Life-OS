import { setze, wert } from '#lib/core/einstellungen.js';
import { toastState } from '#lib/core/toast.svelte.js';
import {
	automationEingerichtet,
	leseUeberschreibung,
	setzeUeberschreibung
} from '#lib/features/automationen/einstellungen.js';
import { automationen } from '#lib/features/automationen/laufzeit.svelte.js';
import { trainingRoutine } from '#lib/features/automationen/regeln.js';
import { goalsState } from '#lib/features/goals/store.svelte.js';
import { habitsState } from '#lib/features/habits/store.svelte.js';
import { findeTrainingsRoutine } from '#lib/features/habits/training-name.js';
import { profileState } from '#lib/features/profile/store.svelte.js';

/**
 * Einmalige Einrichtung für Bestandsnutzer (T205, Zielbild C7).
 *
 * Bisher hakte die App nach einem Training heimlich die „passende" Routine ab. Damit das alte
 * Verhalten bleibt, aber sichtbar und abschaltbar wird, trägt diese Funktion die gefundene Routine
 * einmal als Parameter von `sys:training-routine` ein und vermerkt es im Protokoll.
 *
 * Läuft nach `ladeAlles()`. `system` darf mehrere Stores lesen — Features dürfen es nicht.
 */
export async function richteAutomationenEin(): Promise<void> {
	try {
		if (wert(automationEingerichtet)) return;
		// Nur auf vollständigen Daten: Ein fehlgeschlagener Ladevorgang sähe sonst wie „keine Routine" aus
		// und würde die Einrichtung für immer als erledigt markieren — oder bestehende Einstellungen überschreiben.
		if (!profileState.loaded || !habitsState.loaded || !goalsState.loaded) return;

		const gesetzt = leseUeberschreibung(trainingRoutine.id).parameter?.habitId;
		if (typeof gesetzt !== 'string') {
			const treffer = findeTrainingsRoutine(habitsState.habits, goalsState.goals);
			if (treffer) {
				await setzeUeberschreibung(trainingRoutine.id, {
					parameter: { habitId: treffer.routine.id }
				});
				const weg = treffer.grund === 'ziel' ? 'über das gekoppelte Ziel' : 'über den Namen';
				automationen.protokolliereEinrichtung(
					trainingRoutine,
					`Regel eingerichtet: „${treffer.routine.name}" (gefunden ${weg})`
				);
				toastState.info(
					`Nach einem Training wird „${treffer.routine.name}" abgehakt — das lässt sich unter Einstellungen → Verknüpfungen ändern.`
				);
			}
		}
		await setze(automationEingerichtet, true);
	} catch (err) {
		// Die Einrichtung darf den App-Start nie stören; beim nächsten Start versucht sie es erneut.
		console.error('[automationen] Einrichtung fehlgeschlagen', err);
	}
}
