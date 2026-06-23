---
title: Life OS — n8n-Automatisierung
tags: [lifeos, n8n, automatisierung, integration, edgefunctions]
aliases: [n8n, Automatisierung, Workflows, Integration]
created: 2026-06-23
status: planung
---

# Life OS — n8n-Automatisierung

> [!note] Kernprinzip
> n8n ist eine **optionale** Integrations- und Orchestrierungsschicht.
> **Keine Geschäftslogik in n8n** — verbindliche Regeln gehören ins Backend
> (Supabase + Edge Functions).

## Verantwortlichkeitsverteilung

```
Frontend          → normale Nutzerinteraktion
Supabase + Edge   → verbindliche Geschäftslogik & Berechtigungen (RLS)
n8n (optional)    → Integrationen & Orchestrierung
Externe Dienste   → nur notwendige Daten & minimale Rechte
```

## Kommunikationsweg

n8n schreibt **nie direkt** in Tabellen. Stattdessen Aufruf **schmaler, authentifizierter
Edge Functions** mit Shared-Secret-Header + `Idempotency-Key`:

```
POST /functions/v1/lifeos-intake
X-LifeOS-Token: <source-secret>
Idempotency-Key: <run-or-batch-id>
```

Die Edge Function validiert, prüft Rechte/Dubletten und schreibt regelkonform.

## Workflow-Katalog

```text
LifeOS - WF-01 - Daily Digest        (06:00 → Push/E-Mail „Heute …")
LifeOS - WF-02 - Reminder Dispatch   (fällige reminders → Push/Telegram)
LifeOS - WF-03 - Recurring Builder   (00:10 → Edge Fn instanziiert Aufgaben/Habits aus rrule)
LifeOS - WF-04 - ICS Calendar Sync   (externe Kalender → events upsert)
LifeOS - WF-05 - Telegram Quick Add  (/task, /note → Intake-Endpoint)
LifeOS - WF-06 - Weekly Review        (So → Ziel-/Streak-Zusammenfassung)
LifeOS - WF-07 - Backup Export        (nightly → Storage/offsite)
```

## Konventionen

- Workflow-Namen: `LifeOS - WF-NN - Zweck`.
- Jeder Lauf sendet `source_id`, `run_external_id`, `items[]`.
- Fehlerbehandlung: Retry bei temporären Fehlern, begrenzte Batch-Größe,
  **keine stillen Fehler**, Benachrichtigung bei Ausfall.
- Zeitzone `Europe/Berlin`.

## Verknüpft

- [[LifeOS_Sicherheit|Sicherheit & Datenschutz]]
- [[LifeOS_Module|Module-Katalog]]
- [[LifeOS_Architektur|Architektur]]
