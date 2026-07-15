<script lang="ts">
	// F5 — Gesten: nach links wischen legt eine „Löschen"-Aktion frei (Muster nativer
	// Fitness-/Mail-Apps). `touch-action: pan-y` überlässt vertikalen Scroll dem Browser
	// und gibt uns nur die horizontale Achse — kein Konflikt mit dem Seiten-Scroll.
	// Bewusst „aufdecken statt sofort löschen": Wischen enthüllt einen Tap-Ziel-Button,
	// erst der Tap löscht (verhindert versehentliches Löschen). Der Papierkorb-Button
	// im Inhalt bleibt zusätzlich erhalten — für Maus/Desktop ohne Wischgeste.
	import { Trash2 } from 'lucide-svelte';
	import { haptic } from '$lib/core/haptics';

	let {
		onDelete,
		label = 'Löschen',
		children
	}: {
		onDelete: () => void;
		label?: string;
		children: import('svelte').Snippet;
	} = $props();

	const ACTION_WIDTH = 76; // px — Breite der freigelegten Löschfläche
	let offset = $state(0);
	let dragging = $state(false);
	let pastThreshold = false;
	let startX = 0;
	let startOffset = 0;

	function onPointerDown(e: PointerEvent) {
		if (e.pointerType === 'mouse') return; // Desktop nutzt den sichtbaren Button
		if ((e.target as HTMLElement)?.closest('input,textarea,select,button,a')) return;
		dragging = true;
		startX = e.clientX;
		startOffset = offset;
		pastThreshold = offset <= -ACTION_WIDTH / 2;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;
		const dx = e.clientX - startX + startOffset;
		offset = Math.max(-ACTION_WIDTH, Math.min(0, dx));
		const nowPast = offset <= -ACTION_WIDTH / 2;
		if (nowPast !== pastThreshold) {
			pastThreshold = nowPast;
			haptic(10);
		}
	}

	function onPointerUp() {
		if (!dragging) return;
		dragging = false;
		offset = offset < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0;
	}

	function confirmDelete() {
		offset = 0;
		onDelete();
	}
</script>

<!-- data-noswipe: eigene Wischgeste — der Tab-Wechsel-Swipe (use:swipe) soll hier nicht mitfeuern. -->
<div data-noswipe class="relative overflow-hidden rounded-2xl">
	<!-- Freigelegte Löschaktion -->
	<div class="absolute inset-y-0 right-0 flex items-stretch" style="width: {ACTION_WIDTH}px;">
		<button
			onclick={confirmDelete}
			aria-label={label}
			tabindex={offset <= -ACTION_WIDTH / 2 ? 0 : -1}
			class="flex w-full items-center justify-center bg-red-500 text-white active:bg-red-600"
		>
			<Trash2 size={18} />
		</button>
	</div>

	<!-- Vordergrund -->
	<div
		role="presentation"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		style="transform: translateX({offset}px); touch-action: pan-y; transition: {dragging ? 'none' : 'transform 0.2s ease'};"
		class="relative"
	>
		{@render children()}
	</div>
</div>
