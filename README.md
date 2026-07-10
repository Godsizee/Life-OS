# Life OS

Moin. Life OS bündelt mein tägliches Chaos in einer schnellen, installierbaren PWA. To-Dos, Einkaufsliste, Gewohnheiten, Kalender und Notizen an einem Ort – geteilter Datenraum für zwei Personen inklusive Echtzeit-Synchronisation.

## Scope & Module

- **Heute-Dashboard:** Die zentrale Anlaufstelle für den aktuellen Tag.
- **Aufgaben & Projekte:** Aufgaben erfassen und verwalten.
- **Notizen:** Schnelle Textnotizen.
- **Gewohnheiten & Routinen:** Gewohnheiten tracken und aufbauen.
- **Kalender & Termine:** Gemeinsame und persönliche Termine.
- **Einkauf & Haushalt:** Geteilte Listen für den Wocheneinkauf.
- **Ziele & Tagebuch:** Reflektion und Stimmungs-Tracker.
- *Hinweis: Finanzen sind und bleiben bei FairShare. Life OS ist komplett unabhängig davon.*

## Architektur & Leitprinzipien

- **KISS:** Eine SvelteKit-App, ein Managed-Backend (Supabase). Keine unnötig aufgeblähte Server-Infrastruktur.
- **OCP (Open/Closed):** Dank Repository-Pattern spricht die UI nur mit der API-Schnittstelle. Das Backend ist jederzeit austauschbar. Module werden einfach in der Registry registriert.
- **SRP (Single Responsibility):** Modularer Code nach Fachdomänen (Feature-Sliced Design).
- **Multi-Tenant:** Mandantenfähig von Tag 1 – bereit für einen SaaS-Pivot.

## Tech Stack

- **Frontend:** Svelte 5 (Runes), SvelteKit, TypeScript
- **Styling:** Tailwind CSS v4
- **Backend:** Supabase (Auth, RLS, Realtime, Postgres)
- **PWA:** `@vite-pwa/sveltekit`, IndexedDB-Outbox
- **Validierung:** Zod
