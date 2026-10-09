<script lang="ts">
	import { Settings, CircleHelp } from '@lucide/svelte';
	import { aktiveModule, setzeAktiv } from '../module-aktiv.svelte.js';
	import { nachBereich } from '#lib/config/bereiche.js';
	import { haptic } from '#lib/core/haptics.js';
	import Sheet from '#lib/ui/Sheet.svelte';

	let { open = $bindable(false), currentPath = '/' }: { open?: boolean; currentPath?: string } =
		$props();

	const gruppen = $derived(nachBereich(aktiveModule.meta));

	function go() {
		haptic(10);
		open = false;
	}

	const zeile =
		'flex min-h-14 items-center gap-3 border-b-[length:var(--rahmen-s)] border-tinte px-3 py-2';
</script>

<Sheet bind:open title="Alle Module" variante="blatt">
	<nav aria-label="Alle Module" class="pb-4">
		{#each gruppen as gruppe (gruppe.bereich.id)}
			<section aria-labelledby="bereich-{gruppe.bereich.id}">
				<h3
					id="bereich-{gruppe.bereich.id}"
					class="mono-label flex flex-wrap items-baseline gap-x-2 border-b-[length:var(--rahmen-s)] border-tinte bg-flaeche-2 px-3 py-1.5"
				>
					{gruppe.bereich.label}
					<span class="text-text-3 normal-case">{gruppe.bereich.frage}</span>
				</h3>
				<ul>
					{#each gruppe.eintraege as module (module.id)}
						{@const Icon = module.icon}
						{@const active = currentPath === module.route}
						<li>
							<a
								href={module.route}
								onclick={go}
								aria-current={active ? 'page' : undefined}
								class="{zeile} {active ? 'bg-flaeche-2' : 'hover:bg-flaeche-2'}"
							>
								<span
									class="flex h-10 w-10 shrink-0 items-center justify-center border-[length:var(--rahmen-s)] border-tinte text-auf-farbe"
									style:background-color="var({module.farbe})"
									aria-hidden="true"
								>
									<Icon size={20} strokeWidth={2.25} />
								</span>
								<span class="flex min-w-0 flex-1 flex-col">
									<span class="text-sm font-semibold">{module.label}</span>
									<span class="text-xs text-text-2">{module.kurz}</span>
								</span>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/each}

		{#if aktiveModule.ausgeschaltet.length > 0}
			<section aria-labelledby="bereich-aus">
				<h3
					id="bereich-aus"
					class="mono-label border-b-[length:var(--rahmen-s)] border-tinte bg-flaeche-2 px-3 py-1.5"
				>
					Ausgeschaltet
				</h3>
				<ul>
					{#each aktiveModule.ausgeschaltet as module (module.id)}
						{@const Icon = module.icon}
						<li class="{zeile} text-text-2">
							<span
								class="flex h-10 w-10 shrink-0 items-center justify-center border-[length:var(--rahmen-s)] border-text-3"
								aria-hidden="true"
							>
								<Icon size={20} strokeWidth={2} />
							</span>
							<span class="min-w-0 flex-1 truncate text-sm font-semibold">{module.label}</span>
							<button
								type="button"
								onclick={() => setzeAktiv(module.id, true)}
								class="mono-label min-h-[var(--ziel-min)] shrink-0 px-2 text-tinte underline decoration-2 underline-offset-4"
							>
								Einschalten
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<ul>
			<li>
				<a
					href="/settings"
					onclick={go}
					aria-current={currentPath === '/settings' ? 'page' : undefined}
					class="{zeile} text-sm font-semibold {currentPath === '/settings'
						? 'bg-flaeche-2'
						: 'hover:bg-flaeche-2'}"
				>
					<Settings size={20} strokeWidth={2} />
					Einstellungen
				</a>
			</li>
			<li>
				<a
					href="/hilfe"
					onclick={go}
					aria-current={currentPath.startsWith('/hilfe') ? 'page' : undefined}
					class="{zeile} text-sm font-semibold hover:bg-flaeche-2"
				>
					<CircleHelp size={20} strokeWidth={2} />
					Hilfe
				</a>
			</li>
		</ul>
	</nav>
</Sheet>
