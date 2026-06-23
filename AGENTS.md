# AGENTS.md — Life OS

Verbindliche Anweisungen für alle KI-Agenten (Gemini CLI, Claude Code, Codex, etc.), die in
diesem Repository arbeiten. Diese Datei ist die einzige Quelle der Wahrheit — `CLAUDE.md`
verweist nur hierher.

## Projektstatus

Planungsphase abgeschlossen, **es existiert noch kein Code** (kein `src/`, kein
`package.json`). Vollständige Architektur liegt in `docs/`. Nächster Schritt: **M0 (Scaffold)**
— siehe `docs/LifeOS_Roadmap.md`. Vor dem ersten Code-Schritt diese Datei und
`docs/LifeOS_Roadmap.md` lesen, nicht einfach lospatchen.

## Projekt in 30 Sekunden

- **Was:** Midweight Life OS als PWA für 2 Personen (später SaaS) — Module: Heute-Dashboard,
  Aufgaben & Projekte, Notizen, Gewohnheiten, Kalender, Einkauf & Haushalt, Ziele & Tagebuch.
- **Was nicht:** Kein Finanzmodul, keine Kopplung an das Schwesterprojekt FairShare
  (`c:\xampp\htdocs\files\Finanzen`). Komplett eigenständiger Build, kein geteilter Code.
- **Stack:** SvelteKit + Svelte 5 (Runes) + TypeScript + Tailwind v4 · Supabase
  (Postgres/Auth/RLS/Realtime/Storage/Edge Functions) · `@vite-pwa/sveltekit` ·
  n8n (optional, nur Orchestrierung).

## Prinzipien — nicht verhandelbar

- **KISS** — keine vorzeitigen Abstraktionen, ein Managed-Backend (Supabase), kein eigener
  Server. Edge Functions nur wo serverseitige Secrets/Regeln nötig sind.
- **OCP** — neue Module über Repository-Pattern (`api.ts`) + Modul-Registry
  (`lib/config/modules.ts`) registrieren. Kern-Code dafür nicht anfassen.
- **SRP** — Feature-Sliced Design: Code nach Fachdomäne (`lib/features/<domain>/`), nicht nach
  Technik. Jedes Feature: `components/` · `api.ts` · `store.svelte.ts` · `types.ts` + `schema.ts`.
- **Mobile First** — Touch-Targets ≥ 48px, Breakpoints für **<360px und ≥360px** zwingend
  gegen 320/360/390/430px testen.
- **Svelte 5 ausschließlich Runes** (`$state`, `$derived`, `$props`, `$effect`) — kein
  `export let`, keine alten Lifecycle-Hooks.
- UI-Komponenten sprechen **nie direkt** mit dem Supabase-Client, nur über `api.ts` des
  jeweiligen Features (Backend muss austauschbar bleiben).
- **RLS ist die Zugriffskontrolle** — Berechtigungslogik nicht zusätzlich im Frontend
  nachbauen oder duplizieren.

## Projektstruktur (Zielbild — Details: `docs/LifeOS_Architektur.md`)

```
src/lib/
├── ui/            # dumme Komponenten, kein State
├── core/          # supabase.ts, auth.svelte.ts, realtime.ts, outbox.ts
├── config/        # modules.ts (Modul-Registry)
└── features/      # tasks/ notes/ habits/ calendar/ shopping/ goals/ journal/ workspace/ dashboard/
```

## Doku-Karte — lies NUR was zur Aufgabe gehört

| Datei | Wann lesen |
|---|---|
| `docs/00_LifeOS_Dashboard.md` | Erster Einstieg / Überblick |
| `docs/00_LifeOS_Konzept.md` | Scope-Fragen, was (nicht) zu v1 gehört |
| `docs/LifeOS_Architektur.md` | Stack-/Strukturfragen |
| `docs/LifeOS_Datenmodell.md` | Tabellen, RLS-Policies, Migrations |
| `docs/LifeOS_Auth_Und_Workspace.md` | Login, Einladung, Sharing-Workflow |
| `docs/LifeOS_PWA_Offline_Realtime.md` | Service Worker, Outbox, Realtime-Channels |
| `docs/LifeOS_Frontend_Guidelines.md` | Tailwind, Breakpoints, Touch, Design-Tokens |
| `docs/LifeOS_Module.md` | Feature-Scope pro Modul |
| `docs/LifeOS_N8n_Automatisierung.md` | Workflow-Konventionen, Edge-Intake |
| `docs/LifeOS_Sicherheit.md` | Datenschutz, Backups, Service-Tokens |
| `docs/LifeOS_Deployment.md` | CI/CD, Hosting, SaaS-Ausbau |
| `docs/LifeOS_Roadmap.md` | Meilensteine, nächster Schritt |

## Session-Protokoll

**Zu Beginn:** `Recent.md` lesen (letzter Stand, offene Punkte) — nicht den ganzen
Verlauf neu erschließen.
**Am Ende:** neuen Block oben in `Recent.md` einfügen: Geänderte Dateien, Entscheidungen,
offene Punkte.

## Token-Sparen — verbindlich

1. **Gezielt lesen, nicht vollständig.** Grep/Suche nutzen, um die relevante Stelle zu finden,
   statt ganze Dateien oder das komplette `docs/`-Verzeichnis zu öffnen.
2. **Nicht doppelt lesen.** Was bereits im Kontext steht, nicht erneut einlesen oder
   zurückspiegeln.
3. **Kein Volltext-Echo.** Dateiinhalte nicht unnötig in Antworten wiederholen — auf
   Pfad + Zeilennummer verweisen (`datei.ts:42`).
4. **Diffs statt Rewrites.** Bestehende Dateien gezielt patchen, nicht komplett neu schreiben,
   wenn nur ein Teil sich ändert.
5. **Bündeln statt einzeln.** Unabhängige Lese-/Suchoperationen in einem Schritt
   zusammenfassen statt sequenziell einzeln auszuführen.
6. **Kurz antworten.** Status-Updates in 1–2 Sätzen. Aufgabenstellung nicht wiederholen,
   keine Abschluss-Zusammenfassung, die nur den Diff nochmal in Worten beschreibt.
7. **Nicht spekulieren.** Bei Unsicherheit über Code/Daten gezielt nachsehen statt großzügig
   zu vermuten und später zu korrigieren — das kostet mehr Tokens als ein gezielter Read.
8. **Verlinken statt duplizieren.** Wissen aus `docs/` referenzieren statt es in
   Code-Kommentaren, PRs oder neuen Dateien zu wiederholen.

## Was NICHT tun

- Keine Kopplung an FairShare (anderes Repo, andere Domäne, andere Datenbank).
- Keine Architektur-Entscheidungen treffen, die `docs/LifeOS_Architektur.md` widersprechen,
  ohne Rückfrage.
- Keine Secrets / `.env`-Dateien committen.
- Keine Abstraktionen "für später" einbauen, die aktuell nicht gebraucht werden (KISS).
