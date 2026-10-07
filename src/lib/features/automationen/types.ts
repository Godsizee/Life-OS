import type { LifeEvent } from '#lib/core/ereignisse.js';
import type { LifeEventType } from '#lib/config/ereignisse.js';
import type { ModulId } from '#lib/config/modules.js';

export type RegelModus = 'auto' | 'fragen';
export interface GeplanteAktion {
	aktion: string;
	parameter: Record<string, unknown>;
}
export interface RegelParameterFeld {
	schluessel: string;
	label: string;
	art: 'routine' | 'ziel' | 'zahl' | 'text';
	hinweis?: string;
}
export interface Regel<T extends LifeEventType = LifeEventType> {
	/** 'sys:training-routine' */
	id: string;
	/** 'Training hakt Routine ab' */
	titel: string;
	/** WENN … DANN … in Klartext — erscheint 1:1 in der UI */
	erklaerung: string;
	ausloeser: T;
	/** alle müssen aktiv sein, sonst ruht die Regel */
	module: ModulId[];
	standard: { aktiv: boolean; modus: RegelModus; parameter: Record<string, unknown> };
	parameterFelder?: RegelParameterFeld[];
	/** REIN: aus Ereignis + Parametern Aktionen ableiten. KEIN Store-Zugriff. */
	plane(e: LifeEvent<T>, parameter: Record<string, unknown>): GeplanteAktion[];
}
export interface RegelUeberschreibung {
	aktiv?: boolean;
	modus?: RegelModus;
	parameter?: Record<string, unknown>;
}
export interface ProtokollEintrag {
	id: string;
	zeit: string;
	regelId: string;
	regelTitel: string;
	ausloeser: LifeEventType;
	beschreibung: string;
	status:
		'ausgefuehrt' | 'vorgeschlagen' | 'abgelehnt' | 'rueckgaengig' | 'ohne-wirkung' | 'fehler';
	fehler?: string;
}
