import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import * as tasksApi from './api';
import { projectInputSchema, taskInputSchema, type TaskInput } from './schema';
import type { Task, TaskStatus } from './types';
import { expandNextOccurrence } from './recurrence';
import { habitsState } from '$lib/features/habits/store.svelte';

class TasksState {
	tasks = $state<Task[]>([]);
	projects = $state<import('./types').Project[]>([]);
	loading = $state(false);
	private workspaceId: string | null = null;
	private unsubscribe: (() => void) | null = null;

	constructor() {
		outbox.registerExecutor('tasks', {
			insert: (payload) => tasksApi.insertRaw(payload as Task),
			update: (payload) => tasksApi.updateRaw(payload as Partial<Task> & { id: string }),
			delete: (payload) => tasksApi.deleteTask((payload as { id: string }).id)
		});
	}

	async load(workspaceId: string) {
		if (this.workspaceId === workspaceId) return;
		this.workspaceId = workspaceId;
		this.loading = true;
		try {
			[this.tasks, this.projects] = await Promise.all([
				tasksApi.listTasks(workspaceId),
				tasksApi.listProjects(workspaceId)
			]);
		} finally {
			this.loading = false;
		}
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
	}

	unload() {
		this.unsubscribe?.();
		this.unsubscribe = null;
		this.tasks = [];
		this.projects = [];
		this.workspaceId = null;
	}

	async addTask(input: { title: string } & Partial<TaskInput>) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const parsed = taskInputSchema.parse(input);
		const now = new Date().toISOString();
		const task: Task = {
			id: crypto.randomUUID(),
			workspace_id: this.workspaceId,
			project_id: parsed.project_id,
			goal_id: parsed.goal_id,
			title: parsed.title,
			status: 'todo',
			priority: parsed.priority,
			due_at: parsed.due_at,
			assignee_id: null,
			rrule: parsed.rrule ?? null,
			position: 0,
			created_by: authState.user!.id,
			created_at: now,
			updated_at: now
		};
		this.tasks = [...this.tasks, task];
		await outbox.runOrQueue('tasks', 'insert', task, () => tasksApi.insertRaw(task));
	}

	async setStatus(id: string, status: TaskStatus) {
		const updated_at = new Date().toISOString();
		const task = this.tasks.find((t) => t.id === id);
		this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, status, updated_at } : t));
		await outbox.runOrQueue('tasks', 'update', { id, status, updated_at }, () =>
			tasksApi.updateRaw({ id, status, updated_at })
		);

		if (status === 'done' && task) {
			const matchedHabit = habitsState.habits.find(
				(h) => !h.archived && h.name.toLowerCase() === task.title.toLowerCase()
			);
			if (matchedHabit && !habitsState.isLoggedToday(matchedHabit.id)) {
				await habitsState.toggleToday(matchedHabit.id);
			}
		}

		if (status === 'done' && task?.rrule) {
			const nextDate = expandNextOccurrence(task);
			if (nextDate) {
				const nextDateStr = nextDate.toISOString().split('T')[0];
				const exists = this.tasks.some(
					(t) =>
						t.title === task.title &&
						t.rrule === task.rrule &&
						t.due_at?.startsWith(nextDateStr)
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

	async removeTask(id: string) {
		this.tasks = this.tasks.filter((t) => t.id !== id);
		await outbox.runOrQueue('tasks', 'delete', { id }, () => tasksApi.deleteTask(id));
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
		const project = await tasksApi.createProject(this.workspaceId, parsed.name);
		this.projects = [...this.projects, project];
	}
}

export const tasksState = new TasksState();
