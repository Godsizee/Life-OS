<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { DURATION, motionDuration } from './motion';
	import { focusTrap, lockScroll, unlockScroll } from './actions/focusTrap';

	let {
		open = $bindable(false),
		label,
		children
	}: {
		open?: boolean;
		label: string;
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
		role="dialog"
		aria-modal="true"
		aria-label={label}
		tabindex="-1"
		onkeydown={handleKeydown}
		class="fixed inset-x-4 top-[10%] z-50 mx-auto max-h-[80dvh] max-w-lg overflow-y-auto rounded-2xl border border-border-color bg-surface-0 shadow-2xl outline-none"
		transition:scale={{ start: 0.96, duration: motionDuration(DURATION.base) }}
	>
		{@render children?.()}
	</div>
{/if}
