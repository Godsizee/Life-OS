<script lang="ts">
	import { workspaceState } from '../store.svelte';

	let { userId, size = 'base' }: { userId: string; size?: 'sm' | 'base' } = $props();

	let member = $derived(workspaceState.members.find((m) => m.user_id === userId));
	let initials = $derived(
		(member?.profile?.display_name ?? 'U')
			.split(' ')
			.map((n) => n[0])
			.join('')
			.slice(0, 2)
			.toUpperCase()
	);

	// Deterministische Farbe basierend auf der UUID
	let colorIndex = $derived(
		userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 6
	);

	const colors = [
		'bg-rose-500',
		'bg-blue-500',
		'bg-emerald-500',
		'bg-amber-500',
		'bg-purple-500',
		'bg-cyan-500'
	];

	let sizeClass = $derived(
		size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-8 w-8 text-xs'
	);
</script>

<div
	class="flex shrink-0 items-center justify-center rounded-full font-semibold text-white {sizeClass} {colors[colorIndex]}"
	title={member?.profile?.display_name ?? 'Unbekannt'}
>
	{initials}
</div>
