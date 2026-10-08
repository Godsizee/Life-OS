<script lang="ts">
	import { Settings } from '@lucide/svelte';
	import { aktiveModule, setzeAktiv } from '../module-aktiv.svelte.js';
	import { haptic } from '#lib/core/haptics.js';
	import Sheet from '#lib/ui/Sheet.svelte';

	let { open = $bindable(false), currentPath = '/' }: { open?: boolean; currentPath?: string } =
		$props();

	function go() {
		haptic(10);
		open = false;
	}
</script>

<Sheet bind:open title="Alle Module" variante="blatt">
	<nav class="px-3 pb-4">
		<!-- 4 Spalten ab 360px, darunter 3 – auf 320px waeren 4 Kacheln zu schmal
		     fuer Icon plus lesbares Label. -->
		<ul class="grid grid-cols-3 gap-1 xs:grid-cols-4">
			{#each aktiveModule.meta as module (module.id)}
				{@const Icon = module.icon}
				{@const active = currentPath === module.route}
				<li>
					<a
						href={module.route}
						onclick={go}
						aria-current={active ? 'page' : undefined}
						class="flex min-h-20 min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-2 transition-transform active:scale-95
							{active ? 'bg-primary-active-bg text-primary-active' : 'text-text-secondary hover:bg-surface-2'}"
					>
						<Icon size={22} strokeWidth={active ? 2.5 : 2} />
						<span class="w-full truncate text-center text-[11px] font-medium">{module.label}</span>
					</a>
				</li>
			{/each}
		</ul>

		{#if aktiveModule.ausgeschaltet.length > 0}
			<div class="mt-2 border-t border-border-color px-1 pt-2">
				<h3 class="px-2 pb-1 text-xs font-semibold text-text-tertiary">Ausgeschaltet</h3>
				<ul>
					{#each aktiveModule.ausgeschaltet as module (module.id)}
						{@const Icon = module.icon}
						<li class="flex min-h-12 items-center gap-3 rounded-xl px-2 text-text-secondary">
							<Icon size={20} strokeWidth={2} />
							<span class="min-w-0 flex-1 truncate text-sm">{module.label}</span>
							<button
								type="button"
								onclick={() => setzeAktiv(module.id, true)}
								class="min-h-12 shrink-0 rounded-xl px-3 text-sm font-medium text-primary-active"
							>
								Einschalten
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="mt-2 border-t border-border-color pt-2">
			<a
				href="/more"
				onclick={go}
				class="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-transform active:scale-95
					{currentPath === '/more'
					? 'bg-primary-active-bg text-primary-active'
					: 'text-text-secondary hover:bg-surface-2'}"
			>
				<Settings size={20} strokeWidth={2} />
				Einstellungen
			</a>
		</div>
	</nav>
</Sheet>
