---
title: Life OS — Dashboard
tags: [lifeos, dashboard, index, planung]
aliases: [Life OS Index, Übersicht, Doku-Start]
created: 2026-06-23
status: planung
---

# Life OS — Dashboard

> Einstiegspunkt für die Projektdokumentation. Eigenständiger Build, **keine Kopplung an FairShare**.

## Was ist Life OS?

Ein **midweight Life Operating System** als PWA für **2 Personen** (später als SaaS),
das Alltag und Selbstorganisation an einem Ort bündelt: Aufgaben, Notizen, Gewohnheiten,
Kalender, Einkauf/Haushalt sowie Ziele & Tagebuch.

## Prinzipien

- **KISS** — eine App, ein Managed-Backend, keine vorzeitigen Abstraktionen
- **OCP** — Repository-Pattern + Modul-Registry: erweitern ohne Kern-Eingriff
- **SRP** — Feature-Sliced Design, jede Notiz/jedes Modul mit klarer Verantwortung
- **Mobile First** — Touch ≥ 48px, Breakpoints für **<360px** und **≥360px**

## Stack (Kurz)

| Schicht | Wahl |
|---|---|
| Frontend | SvelteKit + Svelte 5 (Runes) + TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (Postgres, Auth, RLS, Realtime, Storage, Edge Functions) |
| PWA | `@vite-pwa/sveltekit` + IndexedDB-Outbox |
| Automatisierung | n8n (optionale Orchestrierung) |
| Deployment | Supabase Cloud + Vercel *(oder Coolify/adapter-node)* |

## Doku-Karte

- [[00_LifeOS_Konzept|Konzept & Scope]] — Was, für wen, welche Module
- [[LifeOS_Architektur|Architektur]] — Stack, Prinzipien, Projektstruktur
- [[LifeOS_Datenmodell|Datenmodell & RLS]] — Tabellen, Mandantenfähigkeit
- [[LifeOS_Auth_Und_Workspace|Auth & Workspace]] — Login, Sharing-Handshake
- [[LifeOS_PWA_Offline_Realtime|PWA, Offline & Realtime]]
- [[LifeOS_Frontend_Guidelines|Frontend Guidelines]] — Mobile-First, <360/≥360
- [[LifeOS_Module|Module-Katalog]] — v1 + Backlog
- [[LifeOS_N8n_Automatisierung|n8n-Automatisierung]]
- [[LifeOS_Sicherheit|Sicherheit & Datenschutz]]
- [[LifeOS_Deployment|Deployment & Tooling]]
- [[LifeOS_Roadmap|Roadmap & Meilensteine]]
- [[LifeOS_SaaS_Pilot_Plan|SaaS-Pilot-Plan (P0–P4)]] — **aktueller Fahrplan:** Pilot → SaaS

## Status

Planung abgeschlossen. Nächster Schritt laut [[LifeOS_Roadmap|Roadmap]]: **M0 Setup**.
Session-Log siehe `Recent.md` im Projekt-Root.
