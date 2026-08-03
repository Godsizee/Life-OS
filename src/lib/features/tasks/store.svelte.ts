import { neueId } from '$lib/core/id';
import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import { ladeSicher } from '$lib/core/store-load';
import { loeschenMitUndo } from '$lib/core/undo';
import { toISODate } from '$lib/core/date';
import { weekKey } from '$lib/features/analytics/week-window';
import * as tasksApi from './api';
import { assignColumnPositions } from './utils';
import { projectInputSchema, taskInputSchema, type TaskInput } from './schema';
import type { Project, Task, TaskStatus } from './types';
import { expandNextOccurrence } from './recurrence';
import { habitsState } from '$lib/features/habits/store.svelte';
import { remindersState } from '$lib/features/reminders/store.svelte';

class TasksState {
	tasks = $state<Task[]>([]);
	projects = $state<import('./types').Project[]>([]);
	loading = $state(false);
	/** true erst nach erfolgreichem Laden — leer + loaded ist etwas anderes als leer + Fehler. */
	loaded = $state(false);
	private workspaceId: string | null = null;
	private unsubscribe: (() => void) | null = null;
	private unsubscribeProjects: (() => void) | null = null;

	constructor() {
		outbox.registerExecutor('tasks', {
			insert: (payload) => tasksApi.insertRaw(payload as Task),
			// Ein Array ist die Stapelvariante aus setPositions(). Bewusst unter
			// demselben Tabellenschluessel: die Outbox haelt die Reihenfolge nur je
			// Tabelle ein — mit einem eigenen Schluessel koennte eine Umsortierung
			// den Insert der Aufgabe ueberholen, die sie sortiert.
			update: (payload) =>
				Array.isArray(payload)
					? tasksApi.upsertManyRaw(payload as Task[])
					: tasksApi.updateRaw(payload as Partial<Task> & { id: string }),
			delete: (payload) => tasksApi.deleteTask((payload as { id: string }).id)
		});
		outbox.registerExecutor('projects', {
			insert: (payload) => tasksApi.insertProjectRaw(payload as Project),
			delete: (payload) => tasksApi.deleteProject((payload as { id: string }).id)
		});
	}

	async load(workspaceId: string) {
		if (this.workspaceId === workspaceId) return;
		this.workspaceId = workspaceId;
		this.loading = true;
		const ok = await ladeSicher('Aufgaben', async () => {
			[this.tasks, this.projects] = await Promise.all([
				tasksApi.listTasks(workspaceId),
				tasksApi.listProjects(workspaceId)
			]);
		});
		this.loading = false;
		if (!ok) {
			this.workspaceId = null; // naechster Aufruf versucht es erneut
			return;
		}
		this.loaded = true;
		this.subscribe();
	}

	private subscribe() {
		this.unsubscribe?.();
		if (!this.workspaceId) return;
		this.unsubscribe = subscribeToTable<Task>('tasks', this.workspaceId, {
			onInsert: (row) => {
				if (!this.tasks.some((t) => t.id === row.id)) this.tasks = [...this.tasks, row];
			},
			onUpdate: (row) => {
				this.tasks = this.tasks.map((t) => (t.id === row.id ? row : t));
			},
			onDelete: ({ id }) => {
				this.tasks = this.tasks.filter((t) => t.id !== id);
			}
		});
		// Projekte sind publiziert, wurden aber nie abonniert: neue Projekte vom
		// Zweitgeraet tauchten erst nach einem Reload auf.
		this.unsubscribeProjects = subscribeToTable<import('./types').Project>(
			'projects',
			this.workspaceId,
			{
				onInsert: (row) => {
					if (!this.projects.some((p) => p.id === row.id)) this.projects = [...this.projects, row];
				},
				onUpdate: (row) => {
					this.projects = row.archived
						? this.projects.filter((p) => p.id !== row.id)
						: this.projects.map((p) => (p.id === row.id ? row : p));
				},
				onDelete: ({ id }) => {
					this.projects = this.projects.filter((p) => p.id !== id);
				}
			}
		);
	}

	/** Erneut vom Server laden — Abgleich nach Verbindungsabbruch (core/resync.ts). */
	async reload(workspaceId: string) {
		this.workspaceId = null;
		await this.load(workspaceId);
	}

	unload() {
		this.unsubscribe?.();
		this.unsubscribe = null;
		this.unsubscribeProjects?.();
		this.unsubscribeProjects = null;
		this.tasks = [];
		this.projects = [];
		this.loaded = false;
		this.workspaceId = null;
	}

	async addTask(input: { title: string } & Partial<TaskInput>) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const parsed = taskInputSchema.parse(input);
		const now = new Date().toISOString();
		const task: Task = {
			id: neueId(),
			workspace_id: this.workspaceId,
			project_id: parsed.project_id,
			goal_id: parsed.goal_id,
			title: parsed.title,
			description: parsed.description,
			labels: parsed.labels,
			parent_id: parsed.parent_id,
			status: 'todo',
			priority: parsed.priority,
			due_at: parsed.due_at,
			assignee_id: null,
			rrule: parsed.rrule ?? null,
			position: 0,
			created_by: authState.user!.id,
			created_at: now,
			updated_at: now,
			completed_at: null,
			focus_week: null
		};
		this.tasks = [...this.tasks, task];
		await outbox.runOrQueue('tasks', 'insert', task, () => tasksApi.insertRaw(task));
	}

	async setStatus(id: string, status: TaskStatus) {
		const updated_at = new Date().toISOString();
		const task = this.tasks.find((t) => t.id === id);
		// Beim Wiederöffnen zurücksetzen — sonst zählt eine reaktivierte Aufgabe
		// weiterhin in der Woche ihrer alten Erledigung mit.
		const completed_at = status === 'done' ? updated_at : null;

		this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, status, updated_at, completed_at } : t));
		await outbox.runOrQueue('tasks', 'update', { id, status, updated_at, completed_at }, () =>
			tasksApi.updateRaw({ id, status, updated_at, completed_at })
		);

		if (status === 'done') await remindersState.deactivateFor('task', id);

		if (status === 'done' && task) {
			const matchedHabit = habitsState.habits.find(
				(h) => !h.archived && h.name.toLowerCase() === task.title.toLowerCase()
			);
			if (matchedHabit && !habitsState.isDoneToday(matchedHabit.id)) {
				await habitsState.toggleToday(matchedHabit.id);
			}
		}

		if (status === 'done' && task?.rrule) {
			const nextDate = expandNextOccurrence(task);
			if (nextDate) {
				// Beide Seiten in LOKALE Kalendertage umrechnen. Vorher wurde ein
				// per toISOString() erzeugter UTC-Tag gegen den Präfix von due_at
				// geprüft — bei Fälligkeit vor 02:00 MESZ war das der Vortag, die
				// Dublettenprüfung griff nicht und die Serie legte doppelt an.
				const nextDateStr = toISODate(nextDate);
				const exists = this.tasks.some(
					(t) =>
						t.title === task.title &&
						t.rrule === task.rrule &&
						!!t.due_at &&
						toISODate(new Date(t.due_at)) === nextDateStr
				);
				if (!exists) {
					await this.addTask({
						title: task.title,
						project_id: task.project_id,
						goal_id: task.goal_id,
						priority: task.priority,
						due_at: nextDate.toISOString(),
						rrule: task.rrule
					});
				}
			}
		}
	}

	async updateTask(
		id: string,
		patch: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'due_at' | 'labels' | 'project_id' | 'goal_id' | 'rrule' | 'position' | 'assignee_id'>>
	) {
		const updated_at = new Date().toISOString();
		this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, ...patch, updated_at } : t));
		await outbox.runOrQueue('tasks', 'update', { id, ...patch, updated_at }, () =>
			tasksApi.updateRaw({ id, ...patch, updated_at })
		);
		if ('due_at' in patch) await remindersState.syncAnchor('task', id, patch.due_at ?? null);
	}

	async moveTask(id: string, patch: { status?: TaskStatus; position?: number }) {
		const updated_at = new Date().toISOString();
		this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, ...patch, updated_at } : t));
		await outbox.runOrQueue('tasks', 'update', { id, ...patch, updated_at }, () =>
			tasksApi.updateRaw({ id, ...patch, updated_at })
		);
	}

	/** Aufgabe als Wochenfokus markieren (oder Markierung entfernen). */
	async setFocusWeek(id: string, week: string | null) {
		const updated_at = new Date().toISOString();
		this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, focus_week: week, updated_at } : t));
		await outbox.runOrQueue('tasks', 'update', { id, focus_week: week, updated_at }, () =>
			tasksApi.updateRaw({ id, focus_week: week, updated_at })
		);
	}

	/** Die Top-3 der laufenden Woche. */
	focusTasks = $derived.by(() => {
		const key = weekKey(new Date());
		return this.tasks.filter((t) => t.focus_week === key);
	});

	async setAssignee(id: string, assigneeId: string | null) {
		const updated_at = new Date().toISOString();
		this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, assignee_id: assigneeId, updated_at } : t));
		await outbox.runOrQueue('tasks', 'update', { id, assignee_id: assigneeId, updated_at }, () =>
			tasksApi.updateRaw({ id, assignee_id: assigneeId, updated_at })
		);
	}

	/**
	 * Setzt die Reihenfolge der uebergebenen Aufgaben in EINEM Schreibvorgang.
	 *
	 * Vorher lief pro Geschwister ein eigenes updateTask() — bei 30 Aufgaben in
	 * einer Board-Spalte 30 Round-Trips fuer einen einzigen Drop, und jeder
	 * einzelne konnte fuer sich scheitern und die Reihenfolge halb geschrieben
	 * zuruecklassen.
	 */
	async setPositions(orderedIds: string[]) {
		const updated_at = new Date().toISOString();
		const neuePosition = new Map(
			assignColumnPositions(orderedIds).map(({ id, position }) => [id, position])
		);

		this.tasks = this.tasks.map((t) =>
			neuePosition.has(t.id) ? { ...t, position: neuePosition.get(t.id)!, updated_at } : t
		);

		const zeilen = this.tasks.filter((t) => neuePosition.has(t.id));
		if (zeilen.length === 0) return;
		await outbox.runOrQueue('tasks', 'update', zeilen, () => tasksApi.upsertManyRaw(zeilen));
	}

	/** Verschiebt eine Aufgabe innerhalb ihrer Geschwister um eine Position. */
	async move(id: string, richtung: -1 | 1) {
		const task = this.tasks.find((t) => t.id === id);
		if (!task) return;
		const geschwister = this.tasks
			.filter((t) => t.parent_id === task.parent_id && t.status !== 'done')
			.sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
		const i = geschwister.findIndex((t) => t.id === id);
		const j = i + richtung;
		if (i < 0 || j < 0 || j >= geschwister.length) return;
		[geschwister[i], geschwister[j]] = [geschwister[j], geschwister[i]];
		await this.setPositions(geschwister.map((t) => t.id));
	}

	async removeTask(id: string) {
		this.tasks = this.tasks.filter((t) => t.id !== id);
		await outbox.runOrQueue('tasks', 'delete', { id }, () => tasksApi.deleteTask(id));
		await remindersState.removeFor('task', id);
	}

	/**
	 * Löschen mit Rücknahmefenster — für die Wischgeste in der Liste, die sich
	 * mobil leicht versehentlich auslöst. Siehe core/undo.ts.
	 */
	removeTaskWithUndo(id: string) {
		const task = this.tasks.find((t) => t.id === id);
		if (!task) return;
		loeschenMitUndo({
			text: 'Aufgabe gelöscht',
			ausblenden: () => (this.tasks = this.tasks.filter((t) => t.id !== id)),
			// An die alte Stelle zurück, nicht ans Ende: die Liste sortiert nach
			// position, ein Anhängen würde die Reihenfolge sichtbar verändern.
			wiederherstellen: () => {
				if (!this.tasks.some((t) => t.id === id)) this.tasks = [...this.tasks, task];
			},
			festschreiben: async () => {
				await outbox.runOrQueue('tasks', 'delete', { id }, () => tasksApi.deleteTask(id));
				await remindersState.removeFor('task', id);
			}
		});
	}

	async updateGoalLink(id: string, goal_id: string | null) {
		const updated_at = new Date().toISOString();
		this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, goal_id, updated_at } : t));
		await outbox.runOrQueue('tasks', 'update', { id, goal_id, updated_at }, () =>
			tasksApi.updateRaw({ id, goal_id, updated_at })
		);
	}

	async addProject(name: string) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const parsed = projectInputSchema.parse({ name });
		// Wie addTask: id im Client, optimistisch anzeigen, über die Outbox schreiben.
		// Vorher lief das direkt gegen die API und war offline nicht nutzbar.
		const project: Project = {
			id: neueId(),
			workspace_id: this.workspaceId,
			name: parsed.name,
			color: null,
			archived: false,
			created_at: new Date().toISOString()
		};
		this.projects = [...this.projects, project];
		await outbox.runOrQueue('projects', 'insert', project, () =>
			tasksApi.insertProjectRaw(project)
		);
	}
}

export const tasksState = new TasksState();
