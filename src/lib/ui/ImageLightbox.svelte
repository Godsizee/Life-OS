<script lang="ts">
	// Vollbild-Betrachter: Pfeile/Wischen blaettern, Escape schliesst.
	import { ChevronLeft, ChevronRight, X } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { DURATION, motionDuration } from './motion';
	import { lockScroll, unlockScroll } from './actions/focusTrap';

	let {
		open = $bindable(false),
		index = $bindable(0),
		items
	}: {
		open?: boolean;
		index?: number;
		items: { src: string | null; alt: string }[];
	} = $props();

	const current = $derived(items[index] ?? null);

	function close() {
		open = false;
	}

	function step(delta: number) {
		if (items.length === 0) return;
		index = (index + delta + items.length) % items.length;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') close();
		else if (event.key === 'ArrowLeft') step(-1);
		else if (event.key === 'ArrowRight') step(1);
	}

	let startX = 0;
	function onPointerDown(event: PointerEvent) {
		startX = event.clientX;
	}
	function onPointerUp(event: PointerEvent) {
		const dx = event.clientX - startX;
		if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1);
	}

	$effect(() => {
		if (!open) return;
		lockScroll();
		return () => unlockScroll();
	});
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open && current}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		data-noswipe
		role="dialog"
		aria-modal="true"
		aria-label="Bildansicht"
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
		transition:fade={{ duration: motionDuration(DURATION.fast) }}
		onpointerdown={onPointerDown}
		onpointerup={onPointerUp}
	>
		{#if current.src}
			<img src={current.src} alt={current.alt} class="max-h-[85dvh] max-w-[92vw] object-contain" />
		{/if}

		<button
			type="button"
			onclick={close}
			aria-label="Schließen"
			class="pt-safe absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white active:scale-95"
		>
			<X size={22} />
		</button>

		{#if items.length > 1}
			<button
				type="button"
				onclick={(e) => { e.stopPropagation(); step(-1); }}
				aria-label="Vorheriges Bild"
				class="absolute left-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white active:scale-95"
			>
				<ChevronLeft size={24} />
			</button>
			<button
				type="button"
				onclick={(e) => { e.stopPropagation(); step(1); }}
				aria-label="Nächstes Bild"
				class="absolute right-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white active:scale-95"
			>
				<ChevronRight size={24} />
			</button>
			<span class="pb-safe absolute bottom-4 text-xs font-medium text-white/70">
				{index + 1} / {items.length}
			</span>
		{/if}
	</div>
{/if}
