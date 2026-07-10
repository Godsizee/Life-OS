import { supabase } from './supabase';

interface TableHandlers<T> {
	onInsert?: (row: T) => void;
	onUpdate?: (row: T) => void;
	onDelete?: (row: { id: string }) => void;
}

export function subscribeToTable<T>(
	table: string,
	workspaceId: string,
	handlers: TableHandlers<T>
): () => void {
	const channel = supabase
		.channel(`workspace:${workspaceId}:${table}`)
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table, filter: `workspace_id=eq.${workspaceId}` },
			(payload) => {
				if (payload.eventType === 'INSERT') handlers.onInsert?.(payload.new as T);
				else if (payload.eventType === 'UPDATE') handlers.onUpdate?.(payload.new as T);
				else if (payload.eventType === 'DELETE')
					handlers.onDelete?.(payload.old as { id: string });
			}
		)
		.subscribe();

	return () => {
		supabase.removeChannel(channel);
	};
}
