import type { TimelineEintrag } from '#lib/core/modul.js';
import { aktiveModule } from './module-aktiv.svelte.js';
import { sammleVerlaufIn } from './verlauf-kern.js';

/** Verlauf der aktiven Module im Fenster; abgeschaltete Module erscheinen nicht. */
export const sammleVerlauf = (von: Date, bis: Date): TimelineEintrag[] =>
	sammleVerlaufIn(aktiveModule.liste, von, bis);
