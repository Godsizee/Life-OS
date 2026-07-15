<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { DURATION, EASE_STANDARD, motionDuration } from './motion';
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
</script>

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
		class="pb-safe fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-border-color bg-surface-0 shadow-2xl outline-none"
		transition:fly={{ y: 300, duration: motionDuration(DURATION.base), easing: EASE_STANDARD }}
	>
		<div class="flex shrink-0 justify-center pt-2">
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
