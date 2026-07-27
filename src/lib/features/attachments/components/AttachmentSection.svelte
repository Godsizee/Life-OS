<script lang="ts">
	import { attachmentsState } from '../store.svelte';
	import type { AttachmentEntityType } from '../types';
	import { formatBytes } from '../image';
	import AttachmentGrid from '$lib/ui/AttachmentGrid.svelte';
	import AttachmentPicker from '$lib/ui/AttachmentPicker.svelte';
	import ImageLightbox from '$lib/ui/ImageLightbox.svelte';
	import { toastState } from '$lib/core/toast.svelte';
	import { haptic } from '$lib/core/haptics';

	let {
		entityType,
		entityId,
		readonly = false
	}: {
		entityType: AttachmentEntityType;
		entityId: string;
		readonly?: boolean;
	} = $props();

	let uploading = $state(false);
	let lightboxOpen = $state(false);
	let lightboxIndex = $state(0);

	const items = $derived(attachmentsState.forEntity(entityType, entityId));

	const tiles = $derived(
		items.map((a) => ({
			id: a.id,
			src: attachmentsState.srcFor(a),
			alt: `Anhang (${formatBytes(a.size_bytes)})`
		}))
	);

	$effect(() => {
		void attachmentsState.ensureUrls(items);
	});

	async function pick(files: File[]) {
		uploading = true;
		try {
			for (const file of files) {
				try {
					await attachmentsState.add(entityType, entityId, file);
				} catch (error) {
					toastState.error(error instanceof Error ? error.message : 'Upload fehlgeschlagen');
				}
			}
			haptic();
		} finally {
			uploading = false;
		}
	}

	async function remove(id: string) {
		await attachmentsState.remove(id);
		haptic();
	}

	function open(index: number) {
		lightboxIndex = index;
		lightboxOpen = true;
	}
</script>

<div class="flex flex-col gap-2">
	<AttachmentGrid {tiles} onopen={open} ondelete={readonly ? undefined : remove} {readonly} />

	{#if !readonly}
		<AttachmentPicker
			onpick={pick}
			disabled={uploading}
			label={uploading ? 'Wird verarbeitet…' : 'Bild hinzufügen'}
		/>
	{/if}
</div>

<ImageLightbox bind:open={lightboxOpen} bind:index={lightboxIndex} items={tiles} />
