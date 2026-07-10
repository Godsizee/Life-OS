<script lang="ts">
	import { onDestroy } from 'svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import { analyticsState } from '$lib/features/analytics/store.svelte';
	import { Dumbbell, Plus, Trash2, CheckCircle2, Calendar, Clock, Edit3, Save, Zap, Check, X } from 'lucide-svelte';

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) {
			fitnessState.load(id);
		}
	});

	onDestroy(() => {
		fitnessState.unload();
	});

	let activeTab = $state<'log' | 'plans' | 'history'>('log');

	// Plan Creation
	let newPlanName = $state('');
	let newPlanDesc = $state('');
	async function handleCreatePlan() {
		if (!newPlanName.trim()) return;
		await fitnessState.addPlan({ name: newPlanName, description: newPlanDesc || null });
		newPlanName = '';
		newPlanDesc = '';
	}

	// Exercise Creation
	let selectedPlanId = $state<string>('');
	let newExName = $state('');
	let newExCategory = $state('Kraft');
	let newExSets = $state(3);
	let newExReps = $state(10);
	let newExWeight = $state<number | null>(null);

	async function handleAddExercise(planId: string) {
		if (!newExName.trim()) return;
		await fitnessState.addExercise(planId, {
			name: newExName,
			category: newExCategory,
			default_sets: newExSets,
			default_reps: newExReps,
			default_weight: newExWeight,
			order_index: (fitnessState.exercises[planId]?.length ?? 0) + 1
		});
		newExName = '';
		newExWeight = null;
	}

	// Logging Flow
	// 'freestyle' is a sentinel value meaning "no plan selected"
	let activeLogPlanId = $state<string>('');
	let durationMinutes = $state<number | null>(null);
	let workoutNotes = $state('');
	let activeSetLogs = $state<{ exercise_name: string; set_index: number; reps: number; weight_kg: number | null; completed: boolean }[]>([]);

	// Freestyle inline add-exercise state
	let freeExName = $state('');
	let freeExSets = $state(3);
	let freeExReps = $state(10);
	let freeExWeight = $state<number | null>(null);

	function selectPlanForLogging(planId: string) {
		activeLogPlanId = planId;
		const exs = fitnessState.exercises[planId] ?? [];
		const logsList: typeof activeSetLogs = [];
		exs.forEach((e) => {
			for (let i = 0; i < e.default_sets; i++) {
				logsList.push({
					exercise_name: e.name,
					set_index: i + 1,
					reps: e.default_reps,
					weight_kg: e.default_weight,
					completed: false
				});
			}
		});
		activeSetLogs = logsList;
	}

	function startFreestyleWorkout() {
		activeLogPlanId = 'freestyle';
		activeSetLogs = [];
		freeExName = '';
		freeExSets = 3;
		freeExReps = 10;
		freeExWeight = null;
	}

	function addFreestyleExercise() {
		if (!freeExName.trim()) return;
		const sets = freeExSets > 0 ? freeExSets : 1;
		for (let i = 0; i < sets; i++) {
			activeSetLogs = [
				...activeSetLogs,
				{
					exercise_name: freeExName.trim(),
					set_index: i + 1,
					reps: freeExReps,
					weight_kg: freeExWeight,
					completed: false
				}
			];
		}
		freeExName = '';
		freeExSets = 3;
		freeExReps = 10;
		freeExWeight = null;
	}

	async function handleSaveWorkoutLog() {
		if (!activeLogPlanId) return;
		// For freestyle workouts pass null as planId so the store creates a log without plan reference
		const planId = activeLogPlanId === 'freestyle' ? null : activeLogPlanId;
		await fitnessState.logWorkout(
			planId,
			durationMinutes,
			workoutNotes,
			activeSetLogs
		);

		// Reset
		activeLogPlanId = '';
		durationMinutes = null;
		workoutNotes = '';
		activeSetLogs = [];
		activeTab = 'history';

		// Trigger recalculation of today's life score
		await analyticsState.saveTodayScore();
	}
</script>

<svelte:head>
	<title>Fitness - Workouts & Trainingspläne</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-2">
				<Dumbbell size={28} class="text-primary-600 dark:text-primary-400" />
				<span>Fitness</span>
			</h1>
			<p class="text-sm font-medium text-text-secondary">Verwalte deine Trainingspläne und logge Workouts.</p>
		</div>
	</div>

	<!-- Navigation Tabs -->
	<div class="flex border-b border-border-color">
		<button
			onclick={() => activeTab = 'log'}
			class="flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all
				{activeTab === 'log' ? 'border-primary-600 text-primary-600 dark:border-primary-450 dark:text-primary-400' : 'border-transparent text-text-secondary hover:text-text-primary'}"
		>
			Workout starten
		</button>
		<button
			onclick={() => activeTab = 'plans'}
			class="flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all
				{activeTab === 'plans' ? 'border-primary-600 text-primary-600 dark:border-primary-450 dark:text-primary-400' : 'border-transparent text-text-secondary hover:text-text-primary'}"
		>
			Pläne
		</button>
		<button
			onclick={() => activeTab = 'history'}
			class="flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all
				{activeTab === 'history' ? 'border-primary-600 text-primary-600 dark:border-primary-450 dark:text-primary-400' : 'border-transparent text-text-secondary hover:text-text-primary'}"
		>
			Verlauf
		</button>
	</div>

	<!-- Content Zones -->
	{#if activeTab === 'log'}
		{#if !activeLogPlanId}
			<!-- Plan Selection -->
			<div class="space-y-4">
				<h3 class="text-sm font-bold uppercase tracking-wider text-text-tertiary">Wähle einen Trainingsplan aus:</h3>
				<div class="grid gap-4 sm:grid-cols-2">
					{#each fitnessState.plans as plan (plan.id)}
						<button
							onclick={() => selectPlanForLogging(plan.id)}
							class="glass-card text-left p-5 rounded-2xl hover:border-primary-400 dark:hover:border-primary-900 active:scale-[0.98] transition-all premium-shadow flex flex-col justify-between"
						>
							<div>
								<h4 class="font-bold text-base text-text-primary">{plan.name}</h4>
								{#if plan.description}
									<p class="text-xs text-text-secondary mt-1">{plan.description}</p>
								{/if}
							</div>
							<span class="mt-4 text-xs font-bold text-primary-active flex items-center gap-1">
								<span>Workout starten</span>
								<Check size={12} />
							</span>
						</button>
					{/each}
				</div>

				<!-- Freestyle / empty workout CTA -->
				<div class="pt-2">
					<button
						onclick={startFreestyleWorkout}
						class="w-full glass-card rounded-2xl p-4 premium-shadow border-2 border-dashed border-border-color hover:border-primary-400 dark:hover:border-primary-700 active:scale-[0.99] transition-all flex items-center justify-center gap-3 text-text-secondary hover:text-text-primary"
					>
						<Zap size={18} class="text-primary-active shrink-0" />
						<span class="text-sm font-bold">Leeres Workout starten</span>
						<span class="text-xs text-text-tertiary ml-auto hidden sm:block">Übungen spontan hinzufügen</span>
					</button>
				</div>

				{#if fitnessState.plans.length === 0}
					<div class="col-span-2 text-center py-8 text-text-tertiary border border-dashed border-border-color rounded-2xl text-sm">
						Noch keine Pläne — starte ein leeres Workout oder erstelle einen Plan im Tab „Pläne".
					</div>
				{/if}
			</div>
		{:else}
			<!-- Interactive Log Form -->
			{@const isFreeStyle = activeLogPlanId === 'freestyle'}
			{@const planName = isFreeStyle ? 'Freies Workout' : (fitnessState.plans.find((p) => p.id === activeLogPlanId)?.name ?? 'Training')}
			<div class="space-y-6">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
						{#if isFreeStyle}<Zap size={18} class="text-primary-active" />{/if}
						<span>Logging: {planName}</span>
					</h3>
					<button onclick={() => { activeLogPlanId = ''; activeSetLogs = []; }} class="text-xs font-semibold text-text-tertiary hover:text-text-primary flex items-center gap-1 transition-colors">
						<X size={13} />
						<span>Abbrechen</span>
					</button>
				</div>

				<!-- Set Grid -->
				{#if activeSetLogs.length > 0}
					<div class="space-y-4">
						{#each [...new Set(activeSetLogs.map(s => s.exercise_name))] as exName}
							<div class="glass-card rounded-2xl p-4 premium-shadow space-y-3">
								<h4 class="font-bold text-sm text-text-primary border-b border-border-color pb-2">{exName}</h4>

								<div class="space-y-2">
									{#each activeSetLogs.filter(s => s.exercise_name === exName) as set}
										<div class="flex items-center gap-3">
											<span class="text-xs font-bold text-text-tertiary w-12">Satz {set.set_index}</span>

											<!-- Reps input -->
											<input
												type="number"
												bind:value={set.reps}
												class="w-16 min-h-8 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-center text-text-primary"
												placeholder="Reps"
											/>

											<!-- Weight input -->
											<input
												type="number"
												step="0.5"
												bind:value={set.weight_kg}
												class="w-16 min-h-8 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-center text-text-primary"
												placeholder="kg"
											/>

											<!-- Complete toggle -->
											<button
												onclick={() => set.completed = !set.completed}
												aria-label={set.completed ? 'Satz als offen markieren' : 'Satz als erledigt markieren'}
												class="ml-auto flex h-7 w-7 items-center justify-center rounded-lg border transition-all
													{set.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-border-color bg-surface-0 text-text-tertiary'}"
											>
												<Check size={13} strokeWidth={2.5} />
											</button>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{:else if isFreeStyle}
					<div class="text-center py-6 text-text-tertiary text-sm border border-dashed border-border-color rounded-2xl">
						Noch keine Übungen — füge unten deine erste hinzu.
					</div>
				{/if}

				<!-- Freestyle: inline add-exercise form -->
				{#if isFreeStyle}
					<div class="glass-card rounded-2xl p-4 premium-shadow space-y-3">
						<h4 class="text-xs font-bold text-text-tertiary uppercase tracking-wider">Übung hinzufügen</h4>
						<div class="grid grid-cols-2 gap-2">
							<input
								placeholder="Übungsname..."
								bind:value={freeExName}
								class="min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary col-span-2"
							/>
							<input
								type="number"
								placeholder="Sätze"
								bind:value={freeExSets}
								class="min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary"
							/>
							<input
								type="number"
								placeholder="Reps"
								bind:value={freeExReps}
								class="min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary"
							/>
							<input
								type="number"
								step="0.5"
								placeholder="Gewicht (kg)"
								bind:value={freeExWeight}
								class="min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary col-span-2"
							/>
						</div>
						<button
							onclick={addFreestyleExercise}
							class="w-full min-h-9 bg-surface-2 hover:bg-surface-3 text-text-primary font-bold text-xs rounded-lg flex items-center justify-center gap-2"
						>
							<Plus size={14} />
							<span>Übung hinzufügen</span>
						</button>
					</div>
				{/if}

				<!-- Stats inputs -->
				<div class="glass-card rounded-2xl p-4 premium-shadow space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<label class="block">
							<span class="text-xs font-bold text-text-tertiary block mb-1">Dauer (Minuten)</span>
							<input
								type="number"
								bind:value={durationMinutes}
								class="w-full min-h-10 rounded-xl border border-border-color bg-surface-0 px-3 text-sm text-text-primary"
							/>
						</label>
						<label class="block">
							<span class="text-xs font-bold text-text-tertiary block mb-1">Notizen / Feedback</span>
							<input
								type="text"
								bind:value={workoutNotes}
								class="w-full min-h-10 rounded-xl border border-border-color bg-surface-0 px-3 text-sm text-text-primary"
								placeholder="z.B. Stark gefühlt"
							/>
						</label>
					</div>
				</div>

				<button
					onclick={handleSaveWorkoutLog}
					class="w-full min-h-12 bg-primary-750 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-850 active:scale-[0.99] transition-all"
				>
					<Save size={18} />
					<span>Workout speichern</span>
				</button>
			</div>
		{/if}
	{:else}
		{@const showPlans = activeTab === 'plans'}
		{#if showPlans}
			<div class="space-y-6">
				<!-- Create Plan Form -->
				<form onsubmit={(e) => { e.preventDefault(); handleCreatePlan(); }} class="glass-card rounded-2xl p-5 premium-shadow space-y-4">
					<h3 class="text-sm font-bold uppercase tracking-wider text-text-tertiary">Neuen Plan erstellen</h3>
					<div class="grid gap-3 sm:grid-cols-2">
						<input
							bind:value={newPlanName}
							placeholder="z.B. Oberkörper / Push"
							class="min-h-10 rounded-xl border border-border-color bg-surface-0 px-3 text-sm text-text-primary"
						/>
						<input
							bind:value={newPlanDesc}
							placeholder="Beschreibung (optional)"
							class="min-h-10 rounded-xl border border-border-color bg-surface-0 px-3 text-sm text-text-primary"
						/>
					</div>
					<button
						type="submit"
						class="min-h-10 w-full rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-sm"
					>
						Erstellen
					</button>
				</form>

				<!-- Plans List -->
				<div class="space-y-4">
					{#each fitnessState.plans as plan (plan.id)}
						<div class="glass-card rounded-2xl p-5 premium-shadow space-y-4">
							<div class="flex items-start justify-between">
								<div>
									<h4 class="font-extrabold text-base text-text-primary">{plan.name}</h4>
									{#if plan.description}
										<p class="text-xs text-text-secondary mt-1">{plan.description}</p>
									{/if}
								</div>
								<button
									onclick={() => fitnessState.removePlan(plan.id)}
									aria-label="Plan löschen"
									class="text-red-500 hover:text-red-700 transition-colors p-1"
								>
									<Trash2 size={16} />
								</button>
							</div>

							<!-- Exercises inside Plan -->
							<div class="border-t border-border-color pt-3 space-y-3">
								<h5 class="text-xs font-bold text-text-tertiary uppercase tracking-wider">Übungen:</h5>
								<ul class="space-y-2">
									{#each fitnessState.exercises[plan.id] ?? [] as ex}
										<li class="flex items-center justify-between text-xs text-text-secondary bg-surface-1/50 px-3 py-2 rounded-lg border border-border-color">
											<span>{ex.name} ({ex.category})</span>
											<span class="font-semibold">{ex.default_sets} Sätze x {ex.default_reps} Reps {#if ex.default_weight} @ {ex.default_weight}kg{/if}</span>
											<button
												onclick={() => fitnessState.removeExercise(plan.id, ex.id)}
												aria-label="Übung entfernen"
												class="ml-2 text-red-400 hover:text-red-600 transition-colors flex items-center"
											>
												<X size={13} />
											</button>
										</li>
									{/each}
								</ul>

								<!-- Add Exercise Inline Form -->
								<div class="grid grid-cols-2 gap-2 mt-2">
									<input
										placeholder="Übungsname..."
										bind:value={newExName}
										class="min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary col-span-2"
									/>
									<input
										type="number"
										placeholder="Sätze"
										bind:value={newExSets}
										class="min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary"
									/>
									<input
										type="number"
										placeholder="Reps"
										bind:value={newExReps}
										class="min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary"
									/>
								</div>
								<button
									onclick={() => handleAddExercise(plan.id)}
									class="w-full min-h-9 bg-surface-2 hover:bg-surface-3 text-text-primary font-bold text-xs rounded-lg mt-2 flex items-center justify-center gap-2"
								>
									<Plus size={13} />
									<span>Übung hinzufügen</span>
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<!-- History View -->
			<div class="space-y-4">
				{#each fitnessState.logs as log (log.id)}
					{@const planName = fitnessState.plans.find((p) => p.id === log.plan_id)?.name ?? 'Freies Training'}
					<div class="glass-card rounded-2xl p-5 premium-shadow space-y-3">
						<div class="flex items-center justify-between">
							<h4 class="font-bold text-sm text-text-primary flex items-center gap-2">
								{#if !fitnessState.plans.find((p) => p.id === log.plan_id)}
									<Zap size={13} class="text-primary-active shrink-0" />
								{/if}
								{planName}
							</h4>
							<span class="flex items-center gap-1 text-xs text-text-tertiary font-medium">
								<Calendar size={12} />
								<span>{new Date(log.date).toLocaleDateString('de-DE')}</span>
							</span>
						</div>

						<div class="flex gap-4 text-xs font-semibold text-text-secondary border-b border-border-color pb-2">
							{#if log.duration_minutes}
								<span class="flex items-center gap-1">
									<Clock size={12} />
									<span>{log.duration_minutes} Min.</span>
								</span>
							{/if}
							{#if log.notes}
								<span class="flex items-center gap-1">
									<Edit3 size={12} />
									<span>"{log.notes}"</span>
								</span>
							{/if}
						</div>
					</div>
				{:else}
					<div class="text-center py-12 text-text-tertiary">
						Keine aufgezeichneten Workouts vorhanden.
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
