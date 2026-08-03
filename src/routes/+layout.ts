/**
 * Reine Client-App.
 *
 * Alles wird erst im Browser geladen: `authState.init()` in `onMount`, die
 * Feature-Stores im `$effect` des Layouts. Serverseitig entstand damit nur eine
 * leere Huelle — ohne Nutzen, aber mit Risiko: die Stores sind modulweite
 * `$state`-Singletons und waeren bei serverseitigem Schreiben zwischen zwei
 * gleichzeitigen Requests geteilt. Dazu kommt die ganze Klasse der
 * Hydration-Mismatches (Datum, `matchMedia`, `navigator.onLine`).
 *
 * `prerender` bleibt aus: die Routen sind hinter dem Login und haben keinen
 * statisch vorberechenbaren Inhalt.
 */
export const ssr = false;
