import { supabase } from './supabase';
import { fordereAbgleich } from './resync';

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
		// Ohne diesen Callback blieb ein Verbindungsabbruch voellig unbemerkt: der
		// Kanal war tot, die Anwendung zeigte weiter den Stand von vorhin. Jetzt
		// stoesst jeder Fehlerzustand einen Abgleich an — der stellt zugleich die
		// Abos wieder her, weil load() am Ende subscribe() ruft.
		//
		// CLOSED gehoert NICHT dazu: das meldet auch ein regulaeres
		// removeChannel() beim Abmelden oder Workspace-Wechsel.
		.subscribe((status) => {
			if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
				fordereAbgleich(`${table}:${status}`);
			}
		});

	return () => {
		supabase.removeChannel(channel);
	};
}
