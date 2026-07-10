---
title: Life OS — Frontend Guidelines
tags: [lifeos, frontend, svelte, tailwind, mobilefirst, ux]
aliases: [Frontend Guidelines, UI, Mobile First, Svelte 5]
created: 2026-06-23
status: planung
---

# Life OS — Frontend Guidelines (Svelte 5 & Tailwind)

> [!warning] Svelte 5 Regeln
> Ausschließlich **Runes** (`$state`, `$derived`, `$props`, `$effect`).
> Alte Lifecycle-Hooks und `export let` sind tabu.

## Feature-Sliced Design

Struktur unter `src/lib/` nach **Fachdomäne**, nicht nach Technik. Pro Feature:
`components/` · `api.ts` (Repository) · `store.svelte.ts` · `types.ts` + `schema.ts`.
Siehe [[LifeOS_Architektur|Architektur]].

## Repository Pattern

UI-Komponenten sprechen **niemals** direkt mit dem Supabase-Client, sondern nur über das
`api.ts` des jeweiligen Features. → Backend-Wechsel berührt keine `.svelte`-Datei.

## Mobile First — <360px und ≥360px

- Eigener Tailwind-Breakpoint **`xs: 360px`**. Basis-Styles zielen auf den **schmalsten Fall (320px)**,
  `xs:` ergänzt ab 360px.
- **Fluid Typography & Spacing** via `clamp()` → kein Overflow bei 320px.
- **Container Queries** (`@container`) für Modul-Karten → reagieren auf ihre Slot-Breite, nicht nur aufs Viewport.
- Defensive Layouts: `min-w-0`, `truncate`, `flex-wrap`, keine festen Breiten.
- **Test-Matrix:** 320 / 360 / 390 / 430 px (Playwright-Viewports).

## Touch & Feedback

- **Touch-Targets ≥ 48px** (`min-h-12`).
- **Micro-Animation:** `active:scale-95 transition-transform` für taktiles Feedback.
- **Bottom-Navigation** (Daumenreichweite), max. 5 Einträge + „Mehr"-Sheet,
  `env(safe-area-inset-*)` für Notch.

## Design-Tokens

- Hintergrund `slate-50`, Primär-Text `slate-900`, Sekundär-Text `slate-500`.
- Akzent/Erfolg `emerald`, Warnung/Fehler `red`.
- Konsistente Radius-/Shadow-/Spacing-Skala über Tailwind-Theme.

## Verknüpft

- [[LifeOS_Architektur|Architektur]]
- [[LifeOS_PWA_Offline_Realtime|PWA, Offline & Realtime]]
- [[LifeOS_Module|Module-Katalog]]
