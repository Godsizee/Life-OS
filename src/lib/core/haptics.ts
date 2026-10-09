/**
 * haptics.ts
 * Guarded Wrapper um navigator.vibrate — No-op auf Geräten/Browsern ohne Support
 * und wenn die Person die Vibration abgeschaltet hat (`geraet.haptik`).
 */
import { wert } from './einstellungen.js';
import { haptik } from './geraet-einstellungen.js';

export function haptic(pattern: number | number[] = 10) {
	if (typeof navigator === 'undefined' || !navigator.vibrate) return;
	if (!wert(haptik)) return;
	navigator.vibrate(pattern);
}
