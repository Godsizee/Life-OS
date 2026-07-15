/**
 * keyboard.svelte.ts
 * Runes-basierter State, ob die virtuelle Tastatur geöffnet ist (Heuristik über
 * visualViewport). Feature-detected — No-op auf Desktop/Browsern ohne Support.
 */

function createKeyboardState() {
	let open = $state(false);

	function init() {
		if (typeof window === 'undefined' || !window.visualViewport) return;
		const vv = window.visualViewport;

		function update() {
			open = vv!.height < window.innerHeight - 150;
		}

		vv.addEventListener('resize', update);
		update();
	}

	return {
		get open() {
			return open;
		},
		init
	};
}

export const keyboardState = createKeyboardState();
