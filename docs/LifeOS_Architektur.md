---
title: Life OS — Architektur
tags: [lifeos, architektur, stack, sveltekit, supabase]
aliases: [Architektur, Stack, Projektstruktur]
created: 2026-06-23
status: planung
---

# Life OS — Architektur

## Stack & Begründung

| Schicht | Wahl | Warum |
|---|---|---|
| Frontend | **SvelteKit + Svelte 5 (Runes) + TypeScript** | Erprobt, kleinste Bundles, ideal für PWA |
| Styling | **Tailwind CSS v4** + Design-Tokens | Mobile-First, konsistent, schnell |
| Backend | **Supabase** (Postgres, Auth, RLS, Realtime, Storage, Edge Functions) | RLS = Mandantenfähigkeit eingebaut, Realtime statt SSE, kein Docker nötig, Free-Tier |
| PWA | **`@vite-pwa/sveltekit`** + IndexedDB-Outbox | Offline, installierbar |
| Automatisierung | **n8n** (optional) | Orchestrierung, keine Geschäftslogik |
| Deployment | **Supabase Cloud + Vercel** *(oder Coolify/adapter-node)* | KISS, Self-Host bleibt offen |

> [!note] Directus verworfen
> Stärker CMS-orientiert, braucht Docker (nicht vorhanden), schwächeres Multi-Tenant-/RLS-Modell
> für den SaaS-Pivot. Dank Repository-Pattern bleibt ein Wechsel jederzeit möglich.

## Prinzipien — konkret umgesetzt

### KISS
- Eine SvelteKit-App, ein Managed-Backend — **kein eigener Server** anfangs.
- Edge Functions nur für serverseitige Regeln/Secrets (Recurrence, n8n-Endpoints, später Billing).
- Module nach einheitlichem, simplem Schema.

### OCP (Open/Closed)
- **Repository-Pattern:** UI spricht nur mit `api.ts` des Features, nie direkt mit dem
  Supabase-Client → Backend austauschbar.
- **Modul-Registry** (`lib/config/modules.ts`): neue Module registrieren statt Kern ändern.

### SRP (Single Responsibility)
- **Feature-Sliced Design** — Code nach Fachdomäne.
- Pro Feature: `components/` · `api.ts` · `store.svelte.ts` · `types.ts` + `schema.ts` (Zod).
- `ui/` = dumme Komponenten · `core/` = domänenübergreifend.

## Projektstruktur

```text
src/
├── lib/
│   ├── ui/                 # Button, Input, Card, Sheet, BottomNav, Checkbox … (kein State)
│   ├── core/
│   │   ├── supabase.ts     # Client (einzige Stelle, die ihn kennt)
│   │   ├── auth.svelte.ts  # Session-State + Guard
│   │   ├── realtime.ts     # Workspace-Channel-Abo
│   │   ├── outbox.ts       # IndexedDB Offline-Queue + Replay
│   │   └── db.ts           # generische, typisierte Helfer
│   ├── config/
│   │   └── modules.ts      # Modul-Registry (Nav, Routen, Plan-Gating)
│   └── features/
│       ├── workspace/      # Mandant + Mitglieder + Einladungen
│       ├── dashboard/      # „Heute"
│       ├── tasks/          # Aufgaben & Projekte
│       ├── notes/
│       ├── habits/
│       ├── calendar/
│       ├── shopping/       # Einkauf & Haushalt
│       ├── goals/
│       └── journal/        # Tagebuch & Stimmung (persönlich)
├── routes/                 # dünn — delegiert an Features
└── service-worker / app.html / manifest
```

## Verknüpft

- [[LifeOS_Datenmodell|Datenmodell & RLS]]
- [[LifeOS_Frontend_Guidelines|Frontend Guidelines]]
- [[LifeOS_PWA_Offline_Realtime|PWA, Offline & Realtime]]
- [[00_LifeOS_Dashboard|Dashboard]]
