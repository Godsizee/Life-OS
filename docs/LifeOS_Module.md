---
title: Life OS — Module-Katalog
tags: [lifeos, module, features, scope]
aliases: [Module, Module-Katalog, Features, Modul-Registry]
created: 2026-06-23
status: planung
---

# Life OS — Module-Katalog

Alle Module folgen demselben SRP-Bauplan (`components/` · `api.ts` · `store.svelte.ts` ·
`types.ts` + `schema.ts`) und werden in der **Modul-Registry** (`lib/config/modules.ts`)
für Navigation und Plan-Gating registriert (OCP).

## v1 — Module

| Modul | Kern-Funktion v1 | Geteilt / Persönlich |
|---|---|---|
| **Heute** | Aggregiert fällige Aufgaben, heutige Termine, offene Gewohnheiten, Einkaufs-Highlights | abgeleitet |
| **Aufgaben & Projekte** | CRUD, Status, Priorität, Fälligkeit, Zuweisung, Wiederholung (rrule), Sortierung | geteilt |
| **Notizen** | Schnellerfassung, Tags, Pinnen, Markdown-Body, Volltextsuche | geteilt |
| **Gewohnheiten** | Tages-/Wochen-Routinen, Häkchen, **Streaks**, Verlauf | geteilt (Logs je Person) |
| **Kalender** | Termine, All-Day/Recurrence, **ICS-Abo** (read), Erinnerungen | geteilt |
| **Einkauf & Haushalt** | Gemeinsame Liste in Echtzeit, Mengen, Abhaken, Auto-Aufräumen | geteilt |
| **Ziele & Tagebuch** | Ziele/OKRs mit Fortschritt + persönliches Journal & Stimmungs-Check-in | Ziele geteilt, Tagebuch **persönlich** |

> [!note] Wiederholungslogik
> rrule-Auswertung für Aufgaben/Gewohnheiten lebt **serverseitig** (Edge Function).
> n8n triggert nur — siehe [[LifeOS_N8n_Automatisierung|n8n-Automatisierung]].

## Modul-Registry (Skizze)

```ts
// lib/config/modules.ts
export const modules = [
  { id: 'dashboard', label: 'Heute',     icon: Home,     route: '/',          plan: 'free' },
  { id: 'tasks',     label: 'Aufgaben',  icon: CheckSq,  route: '/tasks',     plan: 'free' },
  { id: 'notes',     label: 'Notizen',   icon: FileText, route: '/notes',     plan: 'free' },
  { id: 'habits',    label: 'Routinen',  icon: Repeat,   route: '/habits',    plan: 'free' },
  { id: 'calendar',  label: 'Kalender',  icon: Calendar, route: '/calendar',  plan: 'free' },
  { id: 'shopping',  label: 'Einkauf',   icon: Cart,     route: '/shopping',  plan: 'free' },
  { id: 'goals',     label: 'Ziele',     icon: Target,   route: '/goals',     plan: 'free' },
] as const;
```

→ Neues Modul = neuer Eintrag + neuer Feature-Slice. Kein Eingriff in den Kern.

## v2-Backlog

- Gesundheit/Fitness · Mahlzeitenplanung · Dokumente/Speicher
- OAuth-Login · geteilte öffentliche Listen · Web-Push-Center

## Verknüpft

- [[LifeOS_Architektur|Architektur]]
- [[LifeOS_Datenmodell|Datenmodell & RLS]]
- [[LifeOS_Roadmap|Roadmap]]
