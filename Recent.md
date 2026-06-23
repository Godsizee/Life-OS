# Recent — Life OS

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
