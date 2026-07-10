export interface Calendar {
	id: string;
	workspace_id: string;
	name: string;
	color: string | null;
	ics_url: string | null;
	created_at: string;
	updated_at: string;
}

export interface Event {
	id: string;
	workspace_id: string;
	calendar_id: string;
	title: string;
	start: string;
	end: string;
	all_day: boolean;
	location: string | null;
	rrule: string | null;
	created_by: string;
	created_at: string;
	updated_at: string;
}
