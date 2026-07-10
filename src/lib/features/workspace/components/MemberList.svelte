<script lang="ts">
	import type { WorkspaceMember } from '../types';

	let { members }: { members: WorkspaceMember[] } = $props();
</script>

<ul class="flex flex-col gap-2">
	{#each members as member (member.user_id)}
		<li class="flex items-center justify-between rounded-xl border border-border-color bg-surface-0 p-3">
			<span class="truncate text-text-primary">
				{member.profile?.display_name ?? member.user_id}
			</span>
			<span class="text-xs text-text-secondary">{member.role}</span>
		</li>
	{/each}
</ul>
