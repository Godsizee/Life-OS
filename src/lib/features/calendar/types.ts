export interface Calendar {
	id: string;
	workspace_id: string;
	name: string;
	color: string | null;
	ics_url: string | null;
	ics_last_synced_at?: string | null;
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
	attendee_ids: string[];
	external_uid?: string | null;
	created_by: string;
	created_at: string;
	updated_at: string;
}

export interface EventOverride {
	id: string;
	workspace_id: string;
	event_id: string;
	occurrence_date: string;
	cancelled: boolean;
	patch: EventOverridePatch;
	created_at: string;
	updated_at: string;
}

export interface EventOverridePatch {
	start?: string;
	end?: string;
	title?: string;
	location?: string | null;
}
