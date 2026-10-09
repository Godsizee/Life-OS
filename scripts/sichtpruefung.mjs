// Sichtprüfung ohne echten Login: setzt eine Fake-Sitzung, fängt alle Supabase-Anfragen ab (Prod wird nie angefragt)
// und fotografiert Routen in mehreren Breiten und Themen. Nur ein Entwicklerwerkzeug, nicht Teil des Builds.
//
// Aufruf (Dev-Server muss laufen, `npm run dev`):
//   node scripts/sichtpruefung.mjs <basisUrl> <ausgabeOrdner> <prefix> <breiten,komma> <themen,komma> <routen,komma>
//   z. B. node scripts/sichtpruefung.mjs http://localhost:5173 .tmp-shots t1 360,1280 hell,dunkel heute,tasks
// Routen ohne führenden Schrägstrich angeben (Git Bash macht aus „/“ einen Windows-Pfad); „heute“ ist die Startseite.
//
// Umgebung:
//   PLAYWRIGHT_CORE  Pfad zu playwright-core/index.mjs (noch keine Abhängigkeit, siehe T801)
//   BROWSER_PATH     Pfad zu msedge.exe oder chrome.exe
//   MOCK_DATA=1      liefert Beispielzeilen für Aufgaben, Termine, Routine (heutige Daten)
//   KLICK='sel|sel'  Elemente nacheinander anklicken (Playwright-Selektoren)
//   KEYS='Slash,n'   Tasten drücken (Playwright-Namen, z. B. Slash für „/“)
//   EVAL='(…)'       JS-Ausdruck, dessen Ergebnis ausgegeben wird
//   ELEMENT='sel'    nur dieses Element fotografieren; FULL=1 ganze Seite; SUFFIX=-x Namenszusatz
//   GERAET='{"geraet.zuletztAktiv":"2026-10-03"}'  Geräte-Einstellungen vorbelegen (JSON)
//   SETTINGS='{…}'   Profil-Einstellungen (Standard: Bestandskonto). '{}' = neues Konto → Assistent
//   DEBUG_UEBER=1    Elemente nennen, die rechts über den Rand ragen
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';

const pw = await import(
	process.env.PLAYWRIGHT_CORE ? pathToFileURL(process.env.PLAYWRIGHT_CORE).href : 'playwright-core'
);
const chromium = pw.chromium ?? pw.default.chromium;

const [base, out, prefix, breiten, themen, routen] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

const SB = 'https://sb.dasdann.jetzt';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const uid = '00000000-0000-4000-8000-000000000001';
const exp = Math.floor(Date.now() / 1000) + 86400 * 30;
const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: uid, role: 'authenticated', aud: 'authenticated', email: 'test@example.com', exp })}.sig`;
const user = {
	id: uid,
	aud: 'authenticated',
	role: 'authenticated',
	email: 'test@example.com',
	app_metadata: {},
	user_metadata: {},
	created_at: '2026-01-01T00:00:00Z'
};
const session = {
	access_token: jwt,
	refresh_token: 'x',
	expires_in: 86400 * 30,
	expires_at: exp,
	token_type: 'bearer',
	user
};
const ws = {
	id: '00000000-0000-4000-8000-0000000000aa',
	name: 'Test-Haushalt',
	created_by: uid,
	created_at: '2026-01-01T00:00:00Z'
};
const profil = {
	display_name: 'Test',
	settings: JSON.parse(process.env.SETTINGS || '{"setup.abgeschlossen":"bestand-2026-10-08"}'),
	user_id: uid
};

const heute = new Date();
const tagIso = (d) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const vorTagen = (n) => new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() - n, 12);
const um = (h, m = 0) =>
	new Date(heute.getFullYear(), heute.getMonth(), heute.getDate(), h, m).toISOString();
const basis = {
	workspace_id: '00000000-0000-4000-8000-0000000000aa',
	created_at: '2026-10-01T08:00:00Z',
	updated_at: '2026-10-01T08:00:00Z'
};
const aufgabe = (id, teil) => ({
	...basis,
	id,
	project_id: null,
	goal_id: null,
	description: null,
	labels: [],
	parent_id: null,
	status: 'todo',
	priority: 'medium',
	due_at: null,
	planned_for: null,
	estimate_min: null,
	scheduled_start: null,
	assignee_id: null,
	rrule: null,
	position: 0,
	created_by: '00000000-0000-4000-8000-000000000001',
	completed_at: null,
	focus_week: null,
	...teil
});
const MOCK = process.env.MOCK_DATA
	? {
			tasks: [
				aufgabe('t1', {
					title: 'Steuererklärung vorbereiten',
					planned_for: tagIso(heute),
					estimate_min: 90,
					priority: 'high'
				}),
				aufgabe('t2', { title: 'Wäsche', planned_for: tagIso(heute), estimate_min: 30 }),
				aufgabe('t3', { title: 'Bericht abgeben', due_at: um(17), planned_for: null }),
				aufgabe('t4', {
					title: 'Zeitblock Konzept',
					planned_for: tagIso(heute),
					scheduled_start: um(14),
					estimate_min: 60
				}),
				aufgabe('t5', {
					title: 'Mail beantwortet',
					planned_for: tagIso(heute),
					status: 'done',
					completed_at: um(8, 30)
				}),
				aufgabe('t6', { title: 'Altes Vorhaben', planned_for: tagIso(vorTagen(5)) }),
				aufgabe('t7', { title: 'Frist verpasst', due_at: vorTagen(4).toISOString() })
			],
			calendars: [{ ...basis, id: 'c1', name: 'Privat', color: null, ics_url: null }],
			events: [
				{
					...basis,
					id: 'e1',
					calendar_id: 'c1',
					title: 'Zahnarzt',
					start: um(10),
					end: um(11),
					all_day: false,
					location: null,
					rrule: null,
					attendee_ids: []
				},
				{
					...basis,
					id: 'e2',
					calendar_id: 'c1',
					title: 'Stand-up',
					start: um(9),
					end: um(9, 15),
					all_day: false,
					location: null,
					rrule: null,
					attendee_ids: []
				}
			],
			habits: [
				{
					...basis,
					id: 'h1',
					name: 'Lesen',
					schedule: { type: 'daily' },
					color: null,
					archived: false,
					target_value: null,
					unit: null
				}
			]
		}
	: {};

const cors = {
	'access-control-allow-origin': '*',
	'access-control-allow-headers': '*',
	'access-control-allow-methods': '*',
	'access-control-expose-headers': 'content-range'
};

const browser = await chromium.launch({
	executablePath: process.env.BROWSER_PATH || undefined,
	headless: true
});

const ergebnis = [];
for (const thema of themen.split(',')) {
	for (const breite of breiten.split(',').map(Number)) {
		const ctx = await browser.newContext({
			viewport: { width: breite, height: 800 },
			deviceScaleFactor: 1,
			serviceWorkers: 'block'
		});
		await ctx.addInitScript(
			({ session, thema, geraet }) => {
				localStorage.setItem('sb-sb-auth-token', JSON.stringify(session));
				localStorage.setItem('lifeos:welcome:v1', '1');
				// Nur beim ersten Laden setzen, sonst überschreibt jeder Seitenwechsel „zuletzt aktiv“.
				if (!sessionStorage.getItem('sicht:init')) {
					sessionStorage.setItem('sicht:init', '1');
					localStorage.setItem(
						'lifeos:geraet:v1',
						JSON.stringify({ 'darstellung.thema': thema, ...geraet })
					);
				}
			},
			{ session, thema, geraet: JSON.parse(process.env.GERAET || '{}') }
		);
		await ctx.route(`${SB}/**`, (route) => {
			const req = route.request();
			const url = new URL(req.url());
			if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
			const json = (body, status = 200) =>
				route.fulfill({
					status,
					headers: { ...cors, 'content-type': 'application/json', 'content-range': '0-0/*' },
					body: JSON.stringify(body)
				});
			if (url.pathname.startsWith('/auth/v1/user')) return json(user);
			if (url.pathname.startsWith('/auth/v1/')) return json(session);
			if (url.pathname.startsWith('/rest/v1/rpc/')) return json([]);
			if (url.pathname.startsWith('/rest/v1/')) {
				const tabelle = url.pathname.split('/').pop();
				const einzel = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object');
				const zeilen =
					tabelle === 'workspaces'
						? [ws]
						: tabelle === 'profiles'
							? [profil]
							: (MOCK[tabelle] ?? []);
				if (req.method() !== 'GET')
					return json(
						einzel ? { id: 'mock', date: '2026-10-08', ...(zeilen[0] ?? {}) } : zeilen,
						einzel ? 201 : 200
					);
				return json(einzel ? (zeilen[0] ?? null) : zeilen);
			}
			return json({});
		});
		const page = await ctx.newPage();
		const logs = [];
		page.on('pageerror', (e) =>
			logs.push(
				'pageerror: ' +
					e.message +
					' @ ' +
					String(e.stack).split(String.fromCharCode(10)).slice(1, 4).join(' / ')
			)
		);
		for (const r of routen.split(',')) {
			const pfad = r === 'heute' ? '/' : '/' + r;
			await page.goto(base + pfad, { waitUntil: 'networkidle' }).catch(() => {});
			await page.waitForTimeout(1200);
			if (process.env.KLICK) {
				for (const k of process.env.KLICK.split('|')) {
					await page
						.locator(k)
						.first()
						.click({ timeout: 4000 })
						.catch(() => console.log('klick fehlgeschlagen', k));
					await page.waitForTimeout(700);
				}
			}
			const m = await page.evaluate(() => ({
				pfad: location.pathname,
				scrollW: document.documentElement.scrollWidth,
				innerW: window.innerWidth,
				dunkel: document.documentElement.classList.contains('dark'),
				schrift: getComputedStyle(document.body).fontFamily.slice(0, 40)
			}));
			const ueber = await page.evaluate(() => {
				const w = window.innerWidth;
				return [...document.querySelectorAll('body *')]
					.filter(
						(e) =>
							e.getBoundingClientRect().right > w + 1 && getComputedStyle(e).position !== 'fixed'
					)
					.slice(0, 6)
					.map(
						(e) =>
							`${e.outerHTML.replace(/s+/g, ' ').slice(0, 200)} → ${Math.round(e.getBoundingClientRect().right)}`
					);
			});
			if (ueber.length && process.env.DEBUG_UEBER) console.log(r, breite, ueber);
			if (process.env.KEYS) {
				for (const k of process.env.KEYS.split(',')) {
					await page.keyboard.press(k);
					await page.waitForTimeout(500);
				}
			}
			if (process.env.EVAL) {
				console.log(JSON.stringify(await page.evaluate(process.env.EVAL), null, 1));
			}
			const name = `${prefix}${process.env.SUFFIX ?? ''}-${r.replace(/[/?=]/g, '_')}-${breite}-${thema}.png`;
			if (process.env.ELEMENT) {
				await page.addStyleTag({ content: '.sticky{position:static!important}' });
				await page
					.locator(process.env.ELEMENT)
					.first()
					.screenshot({ path: `${out}/${name}` });
			} else {
				await page.screenshot({ path: `${out}/${name}`, fullPage: process.env.FULL === '1' });
			}
			ergebnis.push({ name, ...m, ok: m.scrollW <= m.innerW });
		}
		if (logs.length) console.log(`[${thema} ${breite}]`, logs.join(' | '));
		await ctx.close();
	}
}
await browser.close();
console.table(ergebnis);
