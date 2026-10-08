// „Tag in Zahlen“: Die Module liefern ihre Teile, system/tageskontext.ts fügt sie zusammen.
// Features lesen hier nur die fertige Quelle (Register-Muster, Zielbild C4).
let quelle: ((datum: string) => Record<string, unknown>) | null = null;

export function setzeTageskontextQuelle(fn: ((datum: string) => Record<string, unknown>) | null) {
	quelle = fn;
}

/** Zusammengefügter Kontext für `datum` ('yyyy-mm-dd'); ohne Quelle `null`. Die Form bestimmt `DayContext` (goals/types.ts). */
export function holeTageskontext<T = Record<string, unknown>>(datum: string): T | null {
	return quelle ? (quelle(datum) as T) : null;
}
