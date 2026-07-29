/**
 * keyboard.svelte.ts
 * Runes-basierter State, ob die virtuelle Tastatur geöffnet ist (Heuristik über
 * visualViewport). Feature-detected — No-op auf Desktop/Browsern ohne Support.
 */

/**
 * Ab dieser Differenz zwischen Layout- und visuellem Viewport gilt die Tastatur
 * als offen. Kleinere Werte gehen auf ein-/ausblendende Browserleisten zurück.
 */
export const KEYBOARD_MIN_OFFSET = 150;

/**
 * Reine Entscheidung, getrennt von den Listenern, damit sie testbar bleibt.
 *
 * Die Breite ist der entscheidende Zusatz: Eine Tastatur verkleinert nur die
 * Höhe. Ändert sich die Breite mit, wurde gedreht oder ein Faltgerät auf-
 * bzw. zugeklappt — dabei melden Layout- und visueller Viewport kurzzeitig
 * unterschiedliche Stände, und die reine Höhenprüfung hielte das für eine
 * Tastatur und führe die Bottom-Nav weg.
 */
export function isKeyboardOpen(
	layoutHeight: number,
	visualHeight: number,
	widthChanged: boolean
): boolean {
	if (widthChanged) return false;
	return layoutHeight - visualHeight > KEYBOARD_MIN_OFFSET;
}

function createKeyboardState() {
	let open = $state(false);

	function init() {
		if (typeof window === 'undefined' || !window.visualViewport) return;
		const vv = window.visualViewport;

		let lastWidth = window.innerWidth;

		function measure() {
			const widthChanged = window.innerWidth !== lastWidth;
			lastWidth = window.innerWidth;
			open = isKeyboardOpen(window.innerHeight, vv.height, widthChanged);
		}

		/**
		 * Der Layout-Viewport ändert sich beim Drehen und Falten, nicht durch die
		 * Tastatur (Chrome-Standard `interactive-widget=resizes-visual`). Danach
		 * einmal neu messen: ein fokussiertes Feld kann den Umbau überdauern.
		 */
		function onLayoutResize() {
			lastWidth = window.innerWidth;
			open = false;
			requestAnimationFrame(measure);
		}

		vv.addEventListener('resize', measure);
		window.addEventListener('resize', onLayoutResize);
		window.addEventListener('orientationchange', onLayoutResize);
		measure();
	}

	return {
		get open() {
			return open;
		},
		init
	};
}

export const keyboardState = createKeyboardState();
