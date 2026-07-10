---
title: Life OS — Roadmap & Meilensteine
tags: [lifeos, roadmap, meilensteine, planung]
aliases: [Roadmap, Meilensteine, Plan, Etappen]
created: 2026-06-23
status: planung
---

# Life OS — Roadmap & Meilensteine

> [!important] Ersetzt durch SaaS-Pilot-Plan (2026-07-06)
> M0–M3 sind umgesetzt. M4/M5 werden durch den [[LifeOS_SaaS_Pilot_Plan|SaaS-Pilot-Plan (P0–P4)]]
> ersetzt: Pilot mit wenigen Haushalten zuerst, SaaS-Ausbau danach. Tabelle unten = Historie.

| Phase | Inhalt | Aufwand |
|---|---|---|
| **M0 Setup** | Repo, SvelteKit+TS+Tailwind, PWA-Shell, UI-Kit, BottomNav, Supabase-Projekt, Auth, Workspace + Einladung, RLS-Baseline | ~1 Wo |
| **M1 Core** | Aufgaben & Projekte, Notizen, Heute-Dashboard, Realtime, Offline-Outbox | ~1–2 Wo |
| **M2 Module** | Gewohnheiten, Kalender, Einkauf, Ziele & Tagebuch | ~2 Wo |
| **M3 PWA-Politur** | Install, Offline-Sync-Status, Web-Push, Responsive-Härtung <360/≥360 | ~1 Wo |
| **M4 Automation** | n8n-Workflows + Edge Functions (Digest, Reminder, Recurring, ICS, Telegram) | ~1 Wo |
| **M5 SaaS** | Pläne, Stripe, Onboarding, Landing | später |

## v2-Backlog

Gesundheit/Fitness · Mahlzeitenplanung · Dokumente/Speicher · OAuth-Login ·
geteilte öffentliche Listen · Web-Push-Center.

## Definition of Done je Modul

- RLS-Policies vorhanden und getestet
- Repository (`api.ts`) + Zod-Schema
- Realtime-Abo + Offline-Outbox angebunden
- Responsive geprüft (320/360/390/430)
- Unit-Tests für Logik (z. B. Streaks, rrule, Aggregation)

## Verknüpft

- [[00_LifeOS_Dashboard|Dashboard]]
- [[LifeOS_Module|Module-Katalog]]
- [[LifeOS_Architektur|Architektur]]
