<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { X } from '@lucide/svelte';
	import { fade, fly } from 'svelte/transition';
	import { panel } from '#lib/core/panel.svelte.js';
	import { DURATION, EASE_STANDARD, EASE_STANDARD_CSS, motionDuration } from './motion';
	import { focusTrap, lockScroll, unlockScroll } from './actions/focusTrap';

	let {
		open = $bindable(false),
		title,
		header,
		variante = 'auto',
		children
	}: {
		open?: boolean;
		title: string;
		header?: Snippet;
		/**
		 * `blatt`: von unten, mit Abdunklung und Fokusfalle.
		 * `panel`: fest rechts (420 px), ohne Abdunklung, Inhalt bleibt bedienbar.
		 * `auto`: Panel ab 1280 px Breite, sonst Blatt.
		 */
		variante?: 'auto' | 'blatt' | 'panel';
		children?: Snippet;
	} = $props();

	let breit = $state(false);
	$effect(() => {
		const mq = window.matchMedia('(min-width: 1280px)');
		breit = mq.matches;
		const onChange = (e: MediaQueryListEvent) => (breit = e.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	const alsPanel = $derived(variante === 'panel' || (variante === 'auto' && breit));

	// Das Layout schafft Platz, solange ein Panel offen ist.
	$effect(() => {
		if (!open || !alsPanel) return;
		// melde() liest und schreibt den Zähler: ohne untrack würde der Effekt sich selbst auslösen.
		return untrack(() => panel.melde());
	});

	function close() {
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	// Nur das Blatt sperrt den Hintergrund; das Panel lässt die Seite bedienbar.
	$effect(() => {
		if (!open || alsPanel) return;
		lockScroll();
		return () => unlockScroll();
	});

	// Als Panel kommt der Fokus beim Öffnen hinein, ohne ihn einzusperren.
	function panelFokus(node: HTMLElement) {
		const davor = document.activeElement as HTMLElement | null;
		node.focus();
		return {
			destroy() {
				davor?.focus();
			}
		};
	}

	// Ziehen am Griff schliesst das Blatt – bis dahin war der Griff reine Deko.
	// Bewusst nur am Kopfbereich, damit das Scrollen im Inhalt unberuehrt bleibt.
	const DISMISS_DISTANCE = 90;
	let dragOffset = $state(0);
	let dragStartY = 0;
	let dragging = false;

	function onPointerDown(event: PointerEvent) {
		if (event.pointerType === 'mouse') return;
		dragging = true;
		dragStartY = event.clientY;
		dragOffset = 0;
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging) return;
		// Nur nach unten – ein Zug nach oben darf das Blatt nicht anheben.
		dragOffset = Math.max(0, event.clientY - dragStartY);
	}

	function onPointerUp() {
		if (!dragging) return;
		dragging = false;
		if (dragOffset > DISMISS_DISTANCE) {
			close();
		}
		dragOffset = 0;
	}

	const schliessen =
		'flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-tinte hover:bg-flaeche-2';
</script>

<svelte:window
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerUp}
/>

{#if open}
	{#if alsPanel}
		<div
			role="dialog"
			aria-modal="false"
			use:panelFokus
			aria-label={title}
			tabindex="-1"
			onkeydown={handleKeydown}
			class="fixed inset-y-0 right-0 z-30 flex w-[420px] max-w-full flex-col border-l-[length:var(--rahmen)] border-tinte bg-flaeche outline-none"
			transition:fly={{ x: 420, duration: motionDuration(DURATION.base), easing: EASE_STANDARD }}
		>
			<div
				class="flex shrink-0 items-center justify-between border-b-[length:var(--rahmen-s)] border-tinte px-4 py-2"
			>
				{#if header}
					{@render header()}
				{:else}
					<h3 class="mono-label">{title}</h3>
				{/if}
				<button onclick={close} aria-label="Schließen" class={schliessen}><X size={18} /></button>
			</div>
			<div class="flex-1 overflow-y-auto">
				{@render children?.()}
			</div>
		</div>
	{:else}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-40 bg-[rgba(11,11,11,0.55)]"
			onclick={close}
			transition:fade={{ duration: motionDuration(DURATION.fast) }}
		></div>

		<div
			use:focusTrap
			data-noswipe
			role="dialog"
			aria-modal="true"
			aria-label={title}
			tabindex="-1"
			onkeydown={handleKeydown}
			class="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-[var(--kante-l)] border-t-[length:var(--rahmen)] border-tinte bg-flaeche pb-safe outline-none"
			style="transform: translateY({dragOffset}px); transition: transform {dragOffset === 0
				? `${motionDuration(DURATION.fast)}ms`
				: '0ms'} {EASE_STANDARD_CSS}"
			transition:fly={{ y: 300, duration: motionDuration(DURATION.base), easing: EASE_STANDARD }}
		>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="flex shrink-0 cursor-grab touch-none justify-center pt-2 active:cursor-grabbing"
				onpointerdown={onPointerDown}
			>
				<div class="h-1.5 w-10 bg-tinte"></div>
			</div>

			<div class="flex shrink-0 items-center justify-between px-4 pt-2 pb-2">
				{#if header}
					{@render header()}
				{:else}
					<h3 class="mono-label">{title}</h3>
				{/if}
				<button onclick={close} aria-label="Schließen" class={schliessen}><X size={18} /></button>
			</div>

			<div class="flex-1 overflow-y-auto">
				{@render children?.()}
			</div>
		</div>
	{/if}
{/if}
