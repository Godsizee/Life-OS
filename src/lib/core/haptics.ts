/**
 * haptics.ts
 * Guarded Wrapper um navigator.vibrate — No-op auf Geräten/Browsern ohne Support.
 */

export function haptic(pattern: number | number[] = 10) {
	if (typeof navigator === 'undefined' || !navigator.vibrate) return;
	navigator.vibrate(pattern);
}
