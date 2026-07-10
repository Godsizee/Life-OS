export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Project {
	id: string;
	workspace_id: string;
	name: string;
	color: string | null;
	archived: boolean;
	created_at: string;
}

export interface Task {
	id: string;
	workspace_id: string;
	project_id: string | null;
	goal_id: string | null;
	title: string;
	status: TaskStatus;
	priority: TaskPriority;
	due_at: string | null;
	assignee_id: string | null;
	rrule: string | null;
	position: number;
	created_by: string;
	created_at: string;
	updated_at: string;
}
