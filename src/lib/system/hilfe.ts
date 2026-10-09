import type { HilfeThema } from '#lib/core/modul.js';
import { MODUL_THEMEN } from '#lib/features/hilfe/inhalte/module.js';
import { SYSTEM_THEMEN } from '#lib/features/hilfe/inhalte/system.js';
import { sammleThemen } from './hilfe-kern.js';
import { aktiveModule, istAktiv } from './module-aktiv.svelte.js';
import type { ModulId } from '#lib/config/modules.js';

/** Alle Hilfethemen: System plus die Themen der aktiven Module (Einstiege und die `hilfe` der Manifeste). */
export function alleThemen(): HilfeThema[] {
	const einstiege = MODUL_THEMEN.filter((t) => istAktiv(t.id.split('.')[0] as ModulId));
	return sammleThemen(aktiveModule.liste, [...SYSTEM_THEMEN, ...einstiege]);
}
