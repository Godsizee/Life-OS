<script lang="ts">
	// F5 — Gesten: nach links wischen legt eine „Löschen"-Aktion frei (Muster nativer
	// Fitness-/Mail-Apps). `touch-action: pan-y` überlässt vertikalen Scroll dem Browser
	// und gibt uns nur die horizontale Achse — kein Konflikt mit dem Seiten-Scroll.
	// Bewusst „aufdecken statt sofort löschen": Wischen enthüllt einen Tap-Ziel-Button,
	// erst der Tap löscht (verhindert versehentliches Löschen). Wischen ist nie der einzige
	// Weg (WCAG 2.5.7): Der Papierkorb-Button im Inhalt bleibt zusätzlich erhalten.
	import { Trash2 } from '@lucide/svelte';
	import { haptic } from '#lib/core/haptics.js';

	let {
		onDelete,
		label = 'Löschen',
		children
	}: {
		onDelete: () => void;
		label?: string;
		children: import('svelte').Snippet;
	} = $props();

	const ACTION_WIDTH = 88; // px — Breite der freigelegten Löschfläche
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
<div data-noswipe class="relative overflow-hidden rounded-lg">
	<!-- Freigelegte Löschaktion -->
	<div class="absolute inset-y-0 right-0 flex items-stretch" style="width: {ACTION_WIDTH}px;">
		<button
			onclick={confirmDelete}
			aria-label={label}
			tabindex={offset <= -ACTION_WIDTH / 2 ? 0 : -1}
			class="mono-label flex w-full flex-col items-center justify-center gap-1 border-l-[length:var(--rahmen)] border-tinte bg-gefahr text-auf-gefahr"
		>
			<Trash2 size={18} />
			Löschen
		</button>
	</div>

	<!-- Vordergrund -->
	<div
		role="presentation"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		style="transform: translateX({offset}px); touch-action: pan-y; transition: {dragging
			? 'none'
			: 'transform var(--dauer-basis) var(--kurve)'};"
		class="relative"
	>
		{@render children()}
	</div>
</div>
