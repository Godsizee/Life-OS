<script lang="ts">
	import { Eye, Hash, ListChecks, Lock, LockOpen, Pen, Pin, Trash2 } from 'lucide-svelte';
	import type { Note } from '../types';
	import { notesState } from '../store.svelte';
	import { checklistProgress, renderMarkdownSafe, toggleChecklistLine } from '../markdown';
	import { authState } from '$lib/core/auth.svelte';
	import { haptic } from '$lib/core/haptics';
	import Sheet from '$lib/ui/Sheet.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Chip from '$lib/ui/Chip.svelte';
	import Button from '$lib/ui/Button.svelte';
	import AttachmentSection from '$lib/features/attachments/components/AttachmentSection.svelte';

	let { note, open = $bindable(false) }: { note: Note | null; open?: boolean } = $props();

	let title = $state('');
	let body = $state('');
	let tags = $state<string[]>([]);
	let newTag = $state('');
	let mode = $state<'edit' | 'preview'>('preview');

	const isAuthor = $derived(!!note && note.created_by === authState.user?.id);
	const progress = $derived(checklistProgress(body));
	const html = $derived(renderMarkdownSafe(body));

	// Lokalen Zustand nur beim Wechsel der Notiz bzw. beim Oeffnen uebernehmen.
	$effect(() => {
		if (note && open) {
			title = note.title;
			body = note.body ?? '';
			tags = [...(note.tags ?? [])];
			mode = (note.body ?? '').trim() === '' ? 'edit' : 'preview';
		}
	});

	function saveTitle() {
		if (note && title.trim() && title !== note.title) {
			notesState.updateNote(note.id, { title: title.trim() });
		}
	}

	function saveBody() {
		if (note && body !== (note.body ?? '')) notesState.updateNote(note.id, { body });
	}

	function addTag(event: KeyboardEvent) {
		if (event.key !== 'Enter' && event.key !== ',') return;
		event.preventDefault();
		const tag = newTag.trim().replace(/^#/, '').toLowerCase();
		newTag = '';
		if (!tag || tags.includes(tag) || !note) return;
		tags = [...tags, tag];
		notesState.updateNote(note.id, { tags });
	}

	function removeTag(tag: string) {
		if (!note) return;
		tags = tags.filter((t) => t !== tag);
		notesState.updateNote(note.id, { tags });
	}

	function insertChecklist() {
		const prefix = body.length === 0 || body.endsWith('\n') ? '' : '\n';
		body = `${body}${prefix}- [ ] `;
		mode = 'edit';
		saveBody();
	}

	/** Klick auf eine gerenderte Checkbox -> Markdown-Zeile kippen und speichern. */
	function onPreviewChange(event: Event) {
		const target = event.target as HTMLElement | null;
		if (!note || !target || target.tagName !== 'INPUT') return;
		const raw = target.getAttribute('data-md-line');
		if (raw === null) return;
		const next = toggleChecklistLine(body, Number(raw));
		if (next === body) return;
		body = next;
		haptic();
		notesState.updateNote(note.id, { body: next });
	}

	function togglePrivate() {
		if (!note) return;
		notesState.updateNote(note.id, { private: !note.private });
		haptic();
	}

	async function del() {
		if (!note) return;
		await notesState.removeNote(note.id);
		open = false;
	}
</script>

<Sheet bind:open title="Notiz">
	{#snippet children()}
		{#if note}
			<div class="flex flex-col gap-4 p-4">
				<Input bind:value={title} onblur={saveTitle} placeholder="Titel" class="font-semibold" />

				<!-- Kopfzeile: Pin, Privat, Modus -->
				<div class="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onclick={() => notesState.togglePin(note.id)}
						class="flex min-h-12 items-center gap-1.5 rounded-xl border border-border-color px-3 text-xs font-bold {note.pinned
							? 'text-accent-600 dark:text-accent-400'
							: 'text-text-secondary'}"
					>
						<Pin size={16} />
						{note.pinned ? 'Angepinnt' : 'Anpinnen'}
					</button>

					{#if isAuthor}
						<button
							type="button"
							onclick={togglePrivate}
							class="flex min-h-12 items-center gap-1.5 rounded-xl border border-border-color px-3 text-xs font-bold {note.private
								? 'text-primary-700 dark:text-primary-400'
								: 'text-text-secondary'}"
						>
							{#if note.private}<Lock size={16} />Privat{:else}<LockOpen size={16} />Geteilt{/if}
						</button>
					{/if}

					<button
						type="button"
						onclick={() => (mode = mode === 'edit' ? 'preview' : 'edit')}
						class="ml-auto flex min-h-12 items-center gap-1.5 rounded-xl border border-border-color px-3 text-xs font-bold text-text-secondary"
					>
						{#if mode === 'edit'}<Eye size={16} />Vorschau{:else}<Pen size={16} />Bearbeiten{/if}
					</button>
				</div>

				{#if note.private && !isAuthor}
					<p class="rounded-xl bg-surface-2 px-3 py-2 text-xs text-text-tertiary">
						Diese Notiz ist privat — nur die Person, die sie angelegt hat, kann den
						Schalter umlegen.
					</p>
				{/if}

				<!-- Inhalt -->
				{#if mode === 'edit'}
					<Field label="Inhalt" hint="Markdown: # Überschrift · - Liste · - [ ] Checkliste · > Zitat">
						<Textarea
							bind:value={body}
							onblur={saveBody}
							surface="1"
							rows={12}
							placeholder="Schreib los…"
						/>
					</Field>
				{:else}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="markdown-body min-h-24" onchange={onPreviewChange}>
						{#if body.trim()}
							{@html html}
						{:else}
							<p class="text-text-tertiary">Noch kein Inhalt.</p>
						{/if}
					</div>
				{/if}

				<div class="flex items-center gap-3">
					<button
						type="button"
						onclick={insertChecklist}
						class="flex min-h-12 items-center gap-1.5 rounded-xl border border-border-color px-3 text-xs font-bold text-text-secondary"
					>
						<ListChecks size={16} /> Checkliste
					</button>
					{#if progress.total > 0}
						<span class="text-xs font-bold text-text-tertiary">
							{progress.done}/{progress.total} erledigt
						</span>
					{/if}
				</div>

				<!-- Tags -->
				<Field label="Tags">
					<Input bind:value={newTag} onkeydown={addTag} placeholder="Neu… (Enter/Komma)" />
					{#if tags.length > 0}
						<div class="mt-2 flex flex-wrap gap-1">
							{#each tags as tag (tag)}
								<Chip onclick={() => removeTag(tag)}>
									<Hash size={12} />{tag}<span class="ml-1 opacity-50">×</span>
								</Chip>
							{/each}
						</div>
					{/if}
				</Field>

				<!-- Anhaenge -->
				<Field label="Anhänge">
					<AttachmentSection entityType="note" entityId={note.id} />
				</Field>

				<div class="mt-2 flex justify-end border-t border-border-color pt-4">
					<Button variant="ghost" onclick={del}>
						{#snippet children()}
							<span class="flex items-center gap-1.5 text-red-500"><Trash2 size={16} /> Löschen</span>
						{/snippet}
					</Button>
				</div>
			</div>
		{/if}
	{/snippet}
</Sheet>
