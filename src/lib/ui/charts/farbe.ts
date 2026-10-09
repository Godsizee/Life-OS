import type { ModulId } from '#lib/config/modules.js';

/** Farben der Diagramme kommen nur über Tokens: Modulfarbe, Signal oder Bedeutungsfarbe. */
export type ChartFarbe = 'signal' | 'info' | 'erfolg' | 'gefahr' | ModulId;

export function farbeVar(farbe: ChartFarbe): string {
	if (farbe === 'signal') return 'var(--signal)';
	if (farbe === 'info' || farbe === 'erfolg' || farbe === 'gefahr') return `var(--${farbe})`;
	return `var(--mod-${farbe})`;
}

/** Datentabelle als Alternative zum Diagramm (`ChartRahmen`). */
export interface ChartTabelle {
	kopf: string[];
	zeilen: string[][];
}
