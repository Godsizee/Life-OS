import type { HilfeThema } from '#lib/core/modul.js';
import { SYSTEM_THEMEN } from '#lib/features/hilfe/inhalte/system.js';
import { sammleThemen } from './hilfe-kern.js';
import { aktiveModule } from './module-aktiv.svelte.js';

/** Alle Hilfethemen: System plus die Themen der aktiven Module. */
export function alleThemen(): HilfeThema[] {
	return sammleThemen(aktiveModule.liste, SYSTEM_THEMEN);
}
