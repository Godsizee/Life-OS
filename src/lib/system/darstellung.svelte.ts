import { wert } from '#lib/core/einstellungen.js';
import { profileState } from '#lib/features/profile/store.svelte.js';
import {
	bewegung,
	dichte,
	farbintensitaet,
	kanten,
	muster,
	schrift,
	signal,
	sticker
} from './einstellungen/darstellung.js';

const SPIEGEL = 'lifeos:darstellung-spiegel';

/** Setzt oder entfernt `data-<name>` am `<html>`-Element. Standardwerte tragen kein Attribut. */
function attribut(name: string, inhalt: string | null): void {
	const el = document.documentElement;
	if (inhalt === null) el.removeAttribute(`data-${name}`);
	else el.setAttribute(`data-${name}`, inhalt);
}

/**
 * Hält die Darstellungs-Attribute am `<html>`-Element synchron mit den Einstellungen. Das Inline-Skript in
 * app.html setzt sie vor dem ersten Rendern; hier gelten Änderungen sofort. Werte der Nutzer-Einstellungen
 * (Signal, Farbintensität, Sticker) zählen erst, wenn das Profil geladen ist: davor stünden dort nur
 * Standardwerte, und die Seite blitzte beim Start auf. Dieselben drei Werte landen danach als Kopie im
 * lokalen Speicher, aus der das Inline-Skript beim nächsten Kaltstart liest.
 */
export function starteDarstellung(): () => void {
	return $effect.root(() => {
		$effect(() => {
			attribut('dichte', wert(dichte) === 'kompakt' ? 'kompakt' : null);
			const s = wert(schrift);
			attribut('schrift', s === '112' || s === '125' ? s : null);
			attribut('bewegung', wert(bewegung) === 'reduziert' ? 'reduziert' : null);
			attribut('kanten', wert(kanten) === 'gerundet' ? 'gerundet' : null);
			attribut('muster', wert(muster) ? null : 'aus');
		});

		$effect(() => {
			if (!profileState.loaded) return;
			const farbe = wert(signal);
			const gedaempft = wert(farbintensitaet) === 'gedaempft';
			const mitSticker = wert(sticker);
			attribut('signal', farbe === 'pink' ? null : farbe);
			attribut('farben', gedaempft ? 'gedaempft' : null);
			attribut('sticker', mitSticker ? null : 'aus');
			try {
				localStorage.setItem(
					SPIEGEL,
					JSON.stringify({
						'darstellung.signal': farbe,
						'darstellung.farbintensitaet': wert(farbintensitaet),
						'darstellung.sticker': mitSticker
					})
				);
			} catch {
				// Privatmodus: Dann gibt es beim Kaltstart kurz die Standardfarbe.
			}
		});
	});
}
