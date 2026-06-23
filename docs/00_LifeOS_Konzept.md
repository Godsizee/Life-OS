---
title: Life OS — Konzept & Scope
tags: [lifeos, konzept, scope, produkt]
aliases: [Konzept, Scope, Was ist Life OS]
created: 2026-06-23
status: planung
---

# Life OS — Konzept & Scope

## Das Problem

Alltag verteilt sich auf viele Apps: To-Do hier, Notizen dort, Einkaufsliste im Chat,
Gewohnheiten im Kopf, Termine im Kalender. Für **zwei Menschen, die einen gemeinsamen
Alltag organisieren**, entsteht Reibung und Doppelpflege.

**Life OS** bündelt diese Bereiche in einer schnellen, installierbaren PWA mit
geteiltem Datenraum und Echtzeit-Sync.

## Für wen

- **v1:** 2 Personen (ein gemeinsamer Workspace)
- **später:** SaaS — beliebig viele Workspaces (Haushalte/Teams), siehe [[LifeOS_Datenmodell|Datenmodell]]

## Abgrenzung

> [!warning] Eigenständiger Build
> Life OS ist **vollständig unabhängig von FairShare**. Finanzen sind **nicht** Teil von v1
> und bleiben FairShares Domäne. Kein geteilter Code, keine Integration.

## Module v1

Kern (gesetzt): **Heute-Dashboard**, **Aufgaben & Projekte**, **Notizen**.
Zusätzlich gewählt: **Gewohnheiten & Routinen**, **Kalender & Termine**,
**Einkauf & Haushalt**, **Ziele & Tagebuch**.

Details: [[LifeOS_Module|Module-Katalog]].

## v2-Backlog

Gesundheit/Fitness · Mahlzeitenplanung · Dokumente/Speicher · OAuth-Login ·
geteilte öffentliche Listen.

## Leitprinzipien

- **KISS, OCP, SRP** (siehe [[LifeOS_Architektur|Architektur]])
- **Mobile First**, Offline-fähig, Echtzeit zu zweit
- Mandantenfähig ab Tag 1 → SaaS ohne Umbau
