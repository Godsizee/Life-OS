<script lang="ts">
	import type { WorkspaceMember } from '../types';

	let { members }: { members: WorkspaceMember[] } = $props();
</script>

<ul class="flex flex-col gap-2">
	{#each members as member (member.user_id)}
		<li class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
			<span class="truncate text-slate-900">
				{member.profile?.display_name ?? member.user_id}
			</span>
			<span class="text-xs text-slate-500">{member.role}</span>
		</li>
	{/each}
</ul>
