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

## Design-Tokens — „Soft Depth" (seit 2026-07-15)

Tiefe über Flächenabstufung statt Schatten-Übermaß. Glass/Backdrop-Blur ist
ausschließlich für Navigation und Sheet-/Modal-Backdrops reserviert — nicht für
gewöhnliche Content-Cards. **Emerald/Violet-Deep existieren nicht mehr im
Codebase** (`grep -ri emerald src/` → 0 Treffer); jede neue Komponente nutzt
ausschließlich die untenstehenden Tokens.

CSS-Variablen in `src/app.css` (`:root` / `html.dark`):

| Variable | Light | Dark | Zweck |
|---|---|---|---|
| `--surface-1` | `#F6F6F8` | `#0E0E12` | Seiten-Hintergrund |
| `--surface-0` | `#FFFFFF` | `#17171D` | Cards |
| `--surface-2` / `--surface-3` | `#ECECF1` / `#E2E2EA` | `#1F1F27` / `#2A2A34` | Abstufungen (Chips inaktiv, Trenner) |
| `--text-primary` / `-secondary` / `-tertiary` | `#111114` / `#55555F` / `#8E8E99` | `#F4F4F6` / `#B4B4BF` / `#6E6E7A` | Text-Hierarchie |
| `--border-color` | `#E7E7EC` | `#26262E` | Rahmen |
| `--primary-active` / `--primary-active-bg` | `#4F46E5` / `#EEF2FF` | `#818CF8` / `rgba(49,46,129,.35)` | Aktive Nav-/Filter-States |

Akzentfarben im `@theme`-Block (`src/app.css`):

- `primary-50..950` — Indigo-Skala. Interaktiv/aktiv/erledigt/Fortschritt/Erfolgs-Toast.
- `accent-50..950` — Rose-Skala. Highlights/Streaks/sekundäre Betonung. **Niemals für destruktiv.**
- Destruktiv → `red-*`, Warnung → `amber-*` (unverändert, keine eigenen Tokens).
- Kategorie-Badges (z. B. „Gesundheit" im Quick-Add/Analytics/Timeline) dürfen weiterhin
  neutrale Tailwind-Farben (`cyan`, `blue`, `purple`, `pink`, `teal` …) nutzen, um von
  `primary`/`accent` unterscheidbar zu bleiben.
- Radien: `--radius-control: 0.75rem` (Buttons/Inputs/Chips → `rounded-xl`),
  `--radius-card: 1rem` (Cards/Sheets → `rounded-2xl`). Pills `rounded-full`.
- `.hero-gradient` (Indigo→Coral, 135°) **nur** für Dashboard-Begrüßungskarte und Fokus-FAB.

## Primitives-Katalog (`src/lib/ui/`)

Gemeinsame, dumme UI-Bausteine — Feature-Code baut UI ausschließlich hieraus, nicht aus
rohen `<input>`/`<select>`/`<button>` o. Ä.:

| Primitive | Zweck |
|---|---|
| `Button.svelte` | primary/secondary/ghost, `min-h-12 rounded-xl active:scale-95` |
| `Input.svelte` / `Select.svelte` / `Textarea.svelte` | Alle Formularfelder; `text-base` (16px-Floor gegen iOS-Zoom); Rest-Props durchgereicht |
| `Field.svelte` | Label + Hint/Error-Wrapper für ein Formularelement |
| `Card.svelte` | `interactive`-/`shadow`-Varianten für Content-Karten |
| `ListRow.svelte` | Geteiltes Row-Idiom (`leading`/`children`/`trailing`-Snippets, `align: center\|start`) |
| `CheckCircle.svelte` | 48px-Hit-Target, animiertes Häkchen, Haptik beim Toggle |
| `Chip.svelte` | Filter-Pills mit `selected`-State |
| `EmptyState.svelte` | Icon + Titel + Hinweis + optionales Action-Snippet |
| `PageHeader.svelte` | `text-2xl font-bold tracking-tight` + `mb-6`, optional `subtitle`/`trailing`-Snippet (Standard für alle Routen-Header) |
| `Sheet.svelte` / `Modal.svelte` | Bottom-Sheet bzw. zentriertes Overlay; Focus-Trap, Scroll-Lock, Escape/Backdrop schließen |
| `SwipeToDelete.svelte` | Wisch-Geste (Touch) mit Papierkorb-Button als Desktop-Fallback |
| `Skeleton.svelte` | Lade-Platzhalter, an `store.loading` gekoppelt |

**Wichtig:** `transition:`/`animate:` sind in Svelte 5 auf Custom-Component-Tags nicht
erlaubt. Wo Listen-Items als eigene Komponente gerendert werden (z. B. `TaskItem`), muss
das jeweilige `{#each}` das Element in ein `<li class="contents" transition:… animate:…>`
wrappen, das die Directive trägt — `ListRow` selbst rendert bewusst ein `<div>`, nicht
`<li>` (siehe `TaskList.svelte` als Referenz).

## Motion-Konstanten (`src/lib/ui/motion.ts`)

- `DURATION = { fast: 150, base: 250, slow: 350 }` (ms) — jede animierte Komponente
  importiert Dauern von hier statt eigene Werte zu raten.
- `EASE_STANDARD` (`cubic-bezier(0.32, 0.72, 0, 1)`) für Micro-Interactions/Sheets/Modals,
  `EASE_SPRING` (`cubic-bezier(0.34, 1.56, 0.64, 1)`) für Card-Press-States.
- `motionDuration(ms)` liefert `0`, wenn `prefers-reduced-motion: reduce` aktiv ist —
  in jede Transition/Animation einsetzen statt den rohen `DURATION`-Wert.
- Routen-Übergänge laufen über `onNavigate` + `document.startViewTransition`
  (`src/routes/+layout.svelte`), Nav-Chrome (BottomNav/SidebarNav/Sync-Banner) hat eigene
  `view-transition-name`-Werte und bleibt beim Wechsel statisch.

## Verknüpft

- [[LifeOS_Architektur|Architektur]]
- [[LifeOS_PWA_Offline_Realtime|PWA, Offline & Realtime]]
- [[LifeOS_Module|Module-Katalog]]
