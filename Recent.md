# Recent — Life OS

## 2026-06-25 (M3 PWA-Politur umgesetzt: Install, Offline-Sync-Status, Web-Push, Responsive-Härtung)

### Scope-Entscheidung (mit User abgestimmt)
Web-Push auf Subscribe-Infrastruktur begrenzt: VAPID-Keys, `push_subscriptions`-Tabelle, Service-
Worker-Handler, Opt-in-Toggle. Tatsächlicher Versand (Digest/Reminder) bleibt wie geplant M4
(Edge Function liest `push_subscriptions`).

### Geänderte/neue Dateien
- `vite.config.ts` — `SvelteKitPWA` von `generateSW` auf `strategies: 'injectManifest'` umgestellt
  (nötig für eigene `push`/`notificationclick`-Handler). `srcDir`/`filename` bewusst NICHT gesetzt:
  `@vite-pwa/sveltekit` erwartet immer SvelteKits eigene Konvention `src/service-worker.ts` als
  Quelle (kompiliert das selbst, vite-pwa injiziert danach nur den Precache-Manifest-Eintrag) —
  ein eigener Dateiname wie `sw.ts` schlägt beim Build fehl (`swSrc` zeigt fest auf
  `.svelte-kit/output/client/service-worker.js`).
- `src/service-worker.ts` (neu) — Custom Service Worker: `precacheAndRoute(self.__WB_MANIFEST)` +
  `push`-Handler (zeigt Notification) + `notificationclick`-Handler (fokussiert/öffnet Tab). Liegt
  bewusst an dieser Stelle, weil `.svelte-kit/tsconfig.json` genau diesen Pfad bereits vom
  Haupt-TS-Programm ausschließt (Webworker- vs. DOM-Lib-Konflikt um `self`).
- `supabase/migrations/0000000000004_m3_push_subscriptions.sql` — `push_subscriptions` (user_id,
  endpoint, p256dh, auth_key), RLS owner-only (geräte-/personenbezogen, keine Workspace-Freigabe).
- `.env.example` — `VITE_VAPID_PUBLIC_KEY` (echter generierter Public Key, unkritisch) +
  `VAPID_PRIVATE_KEY`-Platzhalter (Private Key NICHT committed, nur im Chat an den User
  übergeben — für M4-Edge-Function lokal in `.env` ablegen).
- `src/lib/core/push.svelte.ts` (neu) — `subscribe()`/`unsubscribe()`/`init()`, spricht wie
  `auth.svelte.ts` direkt mit Supabase (Core-Infra, kein Feature-Slice).
- `src/lib/core/install.svelte.ts` (neu) — fängt `beforeinstallprompt` ab, `canInstall`/`installed`
  State, `install()`.
- `src/routes/+layout.svelte` — `installState.init()`/`pushState.init()` in `onMount`; sichtbarer
  Sync-Status-Banner (offline / syncing / error, tippen = `outbox.replay()`-Retry).
- `src/routes/more/+page.svelte` — Karte „App & Benachrichtigungen": Install-Button (nur wenn
  `canInstall`), Push-Toggle (nur wenn `pushState.supported`) mit Hinweis bei `denied`.
- Responsive-Härtung (320px-Audit, Explore-Agent + manuelle Verifikation):
  `JournalEntryForm.svelte` Mood-Picker (5× `h-12 w-12` ohne Wrap = 272px > ~256px verfügbar in
  verschachtelter Card) auf `flex-1 min-w-0` umgestellt; `Input.svelte` global `min-w-0` ergänzt
  (behebt potenzielles Zusammendrücken neben Button in `ShoppingForm`/`ProjectForm`-Zeilen für
  alle aktuellen und künftigen Nutzungen in einer Flex-Reihe).

### Verifiziert
- `npm run check` — 0 Fehler, gleiche 2 vorbestehende Warnungen wie in M2 (NoteItem, InviteForm).
- `npm run test` — 16/16 grün.
- `npm run build` — Service Worker korrekt gebaut (`service-worker.js`, 37 Precache-Einträge,
  `push`/`notificationclick`-Handler im Output verifiziert via grep).

### Offene Punkte / Nächste Aufgaben
- [ ] Privaten VAPID-Key (im Chat übergeben) in lokale `.env` eintragen, sobald M4-Edge-Function
  zum Push-Versand gebaut wird.
- [ ] Manueller Klick-Test mit echten Supabase-Credentials (Install-Prompt, Push-Opt-in,
  Sync-Banner offline/online) steht weiterhin aus — kein `.env` mit echtem Projekt in dieser Session.
- [ ] M4: ICS-Import, RRULE-Expansion (Edge Function), Reminders/Digest/Telegram via n8n, Edge
  Function zum tatsächlichen Push-Versand (liest `push_subscriptions`, nutzt `VAPID_PRIVATE_KEY`).
- [ ] Responsive-Testmatrix (320/360/390/430px) weiterhin nur Code-Audit, kein Playwright-Setup.

## 2026-06-23 (M2 Module umgesetzt: Gewohnheiten, Kalender, Einkauf, Ziele & Tagebuch)

### Vorab-Check M0/M1
Beide funktional verifiziert (Tasks/Projects, Notizen, Heute-Dashboard, Realtime, Offline-Outbox
laufen). Gefundene Lücken auf Userwunsch vorab geschlossen statt nur dokumentiert:
- PWA-Icons (`static/pwa-192x192.png`, `static/pwa-512x512.png`) fehlten trotz Manifest-Referenz —
  per ImageMagick aus neuem `src/lib/assets/pwa-icon.svg` (emerald + "L"-Monogramm) erzeugt.
- Notizen hatten keine Suche/Markdown — `src/lib/features/notes/markdown.ts` (escape-first, sicherer
  Subset-Renderer, kein Markdown-Paket) + Suchfeld in `routes/notes/+page.svelte` ergänzt.
- Kein Test-Runner vorhanden — Vitest eingeführt (`vite.config.ts` nutzt jetzt `vitest/config`),
  Pflicht für die in der DoD genannte Streak-Logik.

### Geänderte/neue Dateien
- `supabase/migrations/0000000000003_m2_habits_calendar_shopping_goals.sql` — habits, habit_logs,
  calendars, events, shopping_items, goals (+ `goal_status` enum), journal_entries; RLS
  (`journal_entries` zusätzlich owner-only) + Realtime-Publication.
- `src/lib/features/{habits,calendar,shopping,goals}/` — je `types.ts`/`schema.ts`/`api.ts`/
  `store.svelte.ts`/`components/`, exakt nach dem Tasks/Notes-Bauplan (Repository + Outbox +
  Realtime). `habits/streak.ts` (+ `streak.test.ts`) berechnet Streaks rein clientseitig.
  `calendar/recurrence.ts` liefert nur ein Label, keine RRULE-Expansion (lebt laut Doku in M4).
- `src/lib/core/date.ts` — `toISODate` als gemeinsames Util (aus `habits/streak.ts` extrahiert,
  re-exportiert dort weiter, damit bestehende Imports stabil bleiben).
- `src/routes/{habits,calendar,shopping,goals}/+page.svelte` — neue Routen.
- `src/routes/+page.svelte` (Heute-Dashboard) — aggregiert jetzt zusätzlich heutige Termine, fällige
  ungeloggte Gewohnheiten, erste offene Einkaufs-Items.
- `src/routes/more/+page.svelte` — Modul-Links zu Habits/Shopping/Goals ergänzt (BottomNav bleibt
  bei 4 Slots + Mehr, `modules.ts` brauchte keine Änderung).

### Entscheidungen (mit User abgestimmt)
- ICS-Kalender-Abo verschoben auf M4 (Edge Functions) — M2 nur eigene Kalender/Termine per CRUD.
- Keine clientseitige RRULE-Expansion — echte RRULE-Strings werden gespeichert, nur als Label
  angezeigt (`täglich`/`wöchentlich`/`einmalig`).
- Einkauf "Auto-Aufräumen" = manueller "Erledigte löschen"-Button, kein Hintergrund-Job.
- `reminders`-Tabelle bewusst nicht gebaut (explizit M4).
- Ziele & Tagebuch als ein Feature-Slice (`goals/`), da `modules.ts` nur einen kombinierten
  Registry-Eintrag dafür vorsieht.

### Verifiziert
- `npm run test` (Vitest, neu) — 16/16 grün (`streak.test.ts`, `markdown.test.ts`).
- `npm run check` (svelte-check) — 0 Fehler, 2 vorbestehende Warnungen (NoteItem state-capture,
  InviteForm a11y-Label), nicht durch M2 verursacht.
- SSR-Smoke-Test (`npm run dev` + curl) über alle neuen Routen schlägt mit `supabaseUrl is required`
  fehl — **vorbestehende Umgebungslücke**, kein echtes `.env` mit Supabase-Projekt in dieser Session
  vorhanden, betrifft auch `/login` unverändert. Manuelles Durchklicken (Habit abhaken, Termin
  anlegen, Einkauf abhaken, Tagebuch speichern) steht beim User mit echten Supabase-Credentials noch
  aus.

### Offene Punkte / Nächste Aufgaben
- [ ] Manueller Klick-Test mit echten Supabase-Credentials (siehe oben)
- [ ] M3 PWA-Politur (Install, Offline-Sync-Status, Web-Push, Responsive-Härtung)
- [ ] M4: ICS-Import, RRULE-Expansion (Edge Function), Reminders/Digest/Telegram via n8n
- [ ] Responsive-Testmatrix (320/360/390/430px) bisher nur visuell, kein Playwright-Setup

## 2026-06-23 (M0 Scaffold abgeschlossen)

### Geänderte Dateien
- `package.json` / `vite.config.ts` — SvelteKit 5, Tailwind v4, vite-pwa installiert & konfiguriert
- `src/app.css` / `src/app.html` — Globale Tailwind-Einbindung & Body-Klassen
- `src/routes/+layout.svelte` / `src/routes/+page.svelte` — PWA-Shell Layout mit Dummy-Dashboard
- `src/lib/ui/BottomNav.svelte` — Bottom Navigation (Mobile First)
- `src/lib/core/supabase.ts` — Supabase Client Instanziierung
- `supabase/migrations/0000000000000_init_workspace_rls.sql` — Mandanten/RLS-Datenmodell
- *Div. Ordner (`src/lib/features/`, `src/lib/config/`) gemäß Architektur angelegt*

### Entscheidungen
- Svelte 5 CLI genutzt (`sv create`) für sauberes Runes-only Setup.
- `@tailwindcss/vite` (Tailwind v4) direkt integriert, Styles über `app.css`.

### Offene Punkte / Nächste Aufgaben
- [x] M0 scaffolden (SvelteKit + Tailwind + PWA-Shell + Supabase + Auth/Workspace)
- [x] Supabase-Projekt + erste Migration (workspaces, members, invites, RLS)
- [ ] PWA-Icons (192/512 + maskable) bereitstellen
- [ ] M1 Core (Dashboard, Tasks) starten

## 2026-06-23 (Projekt-Planung & Doku angelegt)

### Geänderte Dateien
- `docs/00_LifeOS_Dashboard.md` — Index/Übersicht aller Doku-Notizen
- `docs/00_LifeOS_Konzept.md` — Konzept, Scope, Modulauswahl
- `docs/LifeOS_Architektur.md` — Stack, KISS/OCP/SRP, Projektstruktur
- `docs/LifeOS_Datenmodell.md` — Tabellen, RLS, Mandantenfähigkeit
- `docs/LifeOS_Auth_Und_Workspace.md` — Auth + Workspace-Sharing
- `docs/LifeOS_PWA_Offline_Realtime.md` — PWA, Offline-Outbox, Realtime
- `docs/LifeOS_Frontend_Guidelines.md` — Mobile-First, <360/≥360, Tailwind
- `docs/LifeOS_Module.md` — Module-Katalog v1 + Backlog
- `docs/LifeOS_N8n_Automatisierung.md` — n8n-Workflows, Edge-Intake
- `docs/LifeOS_Sicherheit.md` — RLS, Datenminimierung, Backups
- `docs/LifeOS_Deployment.md` — Supabase + Vercel/Coolify, SaaS-Ausbau
- `docs/LifeOS_Roadmap.md` — Meilensteine M0–M5

### Entscheidungen
- Eigenständiger Build, **keine Kopplung an FairShare**, kein Finanzmodul in v1
- Stack: SvelteKit + Svelte 5 Runes + Tailwind v4 + Supabase + PWA + n8n (optional)
- v1-Module: Heute, Aufgaben & Projekte, Notizen, Gewohnheiten, Kalender, Einkauf, Ziele & Tagebuch

### Offene Punkte / Nächste Aufgaben
- [ ] M0 scaffolden (SvelteKit + Tailwind + PWA-Shell + Supabase + Auth/Workspace)
- [ ] Supabase-Projekt + erste Migration (workspaces, members, invites, RLS)
- [ ] PWA-Icons (192/512 + maskable) bereitstellen
