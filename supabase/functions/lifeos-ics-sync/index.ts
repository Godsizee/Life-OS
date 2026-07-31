import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

/**
 * Minimaler ICS-Parser
 * Nimmt einen ICS-String, zerlegt ihn in VEVENT-Blöcke und extrahiert UID, DTSTART, DTEND, SUMMARY, LOCATION, RRULE
 */
function parseIcs(icsData: string) {
	const events = [];
	const lines = icsData.split(/\r?\n/);
	let inEvent = false;
	let currentEvent: any = null;

	let lastKey = '';

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;

		// ICS continuation lines start with a space or tab
		if (line.match(/^[ \t]/) && lastKey && currentEvent) {
			currentEvent[lastKey] += line.substring(1);
			continue;
		}

		const colonIdx = line.indexOf(':');
		if (colonIdx === -1) continue;
		
		let keyRaw = line.substring(0, colonIdx);
		const value = line.substring(colonIdx + 1);

		// Remove parameters from key (e.g., DTSTART;TZID=Europe/Berlin)
		const paramIdx = keyRaw.indexOf(';');
		const key = paramIdx !== -1 ? keyRaw.substring(0, paramIdx) : keyRaw;
		lastKey = key;

		if (key === 'BEGIN' && value === 'VEVENT') {
			inEvent = true;
			currentEvent = {};
		} else if (key === 'END' && value === 'VEVENT') {
			inEvent = false;
			if (currentEvent && currentEvent.UID && currentEvent.DTSTART) {
				events.push(currentEvent);
			}
			currentEvent = null;
		} else if (inEvent && currentEvent) {
			if (['UID', 'DTSTART', 'DTEND', 'SUMMARY', 'LOCATION', 'RRULE'].includes(key)) {
				currentEvent[key] = value;
			}
		}
	}

	return events;
}

/**
 * Wandelt ICS-Datum (YYYYMMDDTHHMMSSZ oder YYYYMMDD) in ISO-String um
 */
function parseIcsDate(dateStr: string): string | null {
	if (!dateStr) return null;
	if (dateStr.length === 8) {
		return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}T00:00:00Z`;
	}
	const m = dateStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?/);
	if (!m) return null;
	return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7] ? 'Z' : ''}`; // Vereinfacht, echte Timezone-Auflösung ist komplex
}

serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
		const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
		
		const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

		// Lade alle Kalender mit ICS URL
		const { data: calendars, error: calError } = await supabase
			.from('calendars')
			.select('id, workspace_id, ics_url')
			.not('ics_url', 'is', null);
			
		if (calError) throw calError;

		let processed = 0;

		for (const cal of calendars) {
			if (!cal.ics_url) continue;

			try {
				const response = await fetch(cal.ics_url);
				if (!response.ok) {
					console.error(`Fehler beim Abruf von ${cal.ics_url}: ${response.statusText}`);
					continue;
				}
				
				const icsData = await response.text();
				const icsEvents = parseIcs(icsData);
				
				const upsertPayloads = icsEvents.map(e => {
					return {
						workspace_id: cal.workspace_id,
						calendar_id: cal.id,
						external_uid: e.UID,
						title: e.SUMMARY?.substring(0, 200) || 'Termin ohne Titel',
						start: parseIcsDate(e.DTSTART) || new Date().toISOString(),
						end: parseIcsDate(e.DTEND) || parseIcsDate(e.DTSTART) || new Date().toISOString(),
						all_day: e.DTSTART?.length === 8,
						location: e.LOCATION || null,
						rrule: e.RRULE ? `RRULE:${e.RRULE}` : null,
						created_by: '00000000-0000-0000-0000-000000000000', // System user UUID if needed, but RLS uses service_role
						updated_at: new Date().toISOString(),
						attendee_ids: []
					};
				});

				// Da Supabase bei Upserts auf einen Unique-Index (calendar_id, external_uid) angewiesen ist,
				// wird dieser in der Migration angelegt. Wir können also upserten.
				for (let i = 0; i < upsertPayloads.length; i += 100) {
					const batch = upsertPayloads.slice(i, i + 100);
					const { error: upsertError } = await supabase
						.from('events')
						.upsert(batch, { onConflict: 'calendar_id, external_uid', ignoreDuplicates: false });
					
					if (upsertError) console.error('Fehler beim Upsert:', upsertError);
				}

				// Update ics_last_synced_at
				await supabase
					.from('calendars')
					.update({ ics_last_synced_at: new Date().toISOString() })
					.eq('id', cal.id);

				processed++;

			} catch (err) {
				console.error(`Fehler beim Verarbeiten von Kalender ${cal.id}:`, err);
			}
		}

		return new Response(JSON.stringify({ success: true, processed_calendars: processed }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			status: 200
		});
	} catch (error: any) {
		return new Response(JSON.stringify({ error: error.message }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			status: 400
		});
	}
});
