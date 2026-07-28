<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { DURATION, EASE_STANDARD, EASE_STANDARD_CSS, motionDuration } from './motion';
	import { focusTrap, lockScroll, unlockScroll } from './actions/focusTrap';

	let {
		open = $bindable(false),
		title,
		header,
		children
	}: {
		open?: boolean;
		title: string;
		header?: Snippet;
		children?: Snippet;
	} = $props();

	function close() {
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	$effect(() => {
		if (!open) return;
		lockScroll();
		return () => unlockScroll();
	});

	// Ziehen am Griff schliesst das Sheet – bis dahin war der Griff reine Deko.
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
		// Nur nach unten – ein Zug nach oben darf das Sheet nicht anheben.
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
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={onPointerUp} onpointercancel={onPointerUp} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm dark:bg-black/60"
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
		class="pb-safe fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-border-color bg-surface-0 elevation-3 outline-none"
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
			<div class="h-1 w-9 rounded-full bg-surface-3"></div>
		</div>

		<div class="flex shrink-0 items-center justify-between px-4 pb-2 pt-2">
			{#if header}
				{@render header()}
			{:else}
				<h3 class="text-sm font-bold text-text-primary">{title}</h3>
			{/if}
			<button
				onclick={close}
				aria-label="Schließen"
				class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-tertiary transition-transform hover:bg-surface-2 hover:text-text-primary active:scale-95"
			>
				<X size={18} />
			</button>
		</div>

		<div class="flex-1 overflow-y-auto">
			{@render children?.()}
		</div>
	</div>
{/if}
