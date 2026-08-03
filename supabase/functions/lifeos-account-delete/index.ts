// LifeOS — Konto löschen (DSGVO Art. 17).
//
// Aufruf: POST mit `Authorization: Bearer <access_token>` des Nutzers.
// Kein eigener Body, keine Parameter: die Function löscht ausschliesslich das
// Konto, dessen Token sie bekommt. Eine Nutzer-ID als Parameter waere eine
// offene Tuer — sie stuende im Request und liesse sich austauschen.
//
// Die eigentliche Datenloeschung uebernimmt Postgres: alle Fremdschluessel auf
// auth.users stehen seit Migration 12 auf ON DELETE CASCADE (Ausnahme
// tasks.assignee_id -> SET NULL, damit fremde Aufgaben nicht mitgeloescht
// werden, sondern nur ihre Zuweisung verlieren).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function json(payload: unknown, status = 200): Response {
	return new Response(JSON.stringify(payload), {
		status,
		headers: { 'content-type': 'application/json' }
	});
}

Deno.serve(async (req) => {
	if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

	const auth = req.headers.get('Authorization') ?? '';
	const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
	if (!token) return json({ error: 'missing_token' }, 401);

	const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
		auth: { autoRefreshToken: false, persistSession: false }
	});

	// Das Token gegen den Auth-Server pruefen, statt es nur zu dekodieren:
	// ein abgelaufenes oder gefaelschtes JWT darf hier nicht durchkommen.
	const { data, error } = await admin.auth.getUser(token);
	if (error || !data.user) return json({ error: 'invalid_token' }, 401);

	const userId = data.user.id;

	// Workspaces, deren einziger Eigentuemer dieser Nutzer ist, wuerden sonst als
	// Waisen zurueckbleiben — inklusive aller geteilten Daten darin. Migration 12
	// deckt nur die Ketten AB auth.users ab, nicht diesen Fall.
	const { data: eigene } = await admin
		.from('workspaces')
		.select('id')
		.eq('owner_id', userId);

	for (const ws of eigene ?? []) {
		const { count } = await admin
			.from('workspace_members')
			.select('user_id', { count: 'exact', head: true })
			.eq('workspace_id', ws.id)
			.neq('user_id', userId);

		// Nur wenn niemand sonst drin ist. Gibt es weitere Mitglieder, bleibt der
		// Workspace bestehen — die Eigentuemerschaft zu uebertragen ist eine
		// bewusste Entscheidung und gehoert nicht in einen Loeschvorgang.
		if ((count ?? 0) === 0) {
			await admin.from('workspaces').delete().eq('id', ws.id);
		}
	}

	const { error: delError } = await admin.auth.admin.deleteUser(userId);
	if (delError) {
		console.error('[account-delete] deleteUser fehlgeschlagen', delError);
		return json({ error: 'delete_failed', message: delError.message }, 500);
	}

	return json({ ok: true });
});
