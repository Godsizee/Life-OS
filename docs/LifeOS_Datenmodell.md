---
title: Life OS — Datenmodell & RLS
tags: [lifeos, datenmodell, rls, supabase, multitenancy]
aliases: [Datenmodell, RLS, Mandantenfähigkeit, Schema]
created: 2026-06-23
status: planung
---

# Life OS — Datenmodell & RLS

## Kernidee: alles hängt am `workspace`

Ein **Workspace** = geteilter Raum der 2 Personen, später = Haushalt/Team eines Kunden.
**Mandantenfähig ab Tag 1** → SaaS ohne Umbau.

## Tabellen

```text
workspaces        (id, name, owner_id, plan, created_at)
workspace_members (workspace_id, user_id, role[owner|member], joined_at)
invites           (workspace_id, email, token, status, expires_at)
profiles          (user_id, display_name, avatar_url, settings jsonb)

tasks      (id, workspace_id, project_id, title, status, priority, due_at, assignee_id, rrule, position, created_by)
projects   (id, workspace_id, name, color, archived)
notes      (id, workspace_id, title, body, tags[], pinned, updated_by)
habits     (id, workspace_id, name, schedule jsonb, color, archived)
habit_logs (id, workspace_id, habit_id, user_id, date, value)        -- Streaks
calendars  (id, workspace_id, name, color, ics_url)
events     (id, workspace_id, calendar_id, title, start, "end", all_day, location, rrule)
shopping_items (id, workspace_id, name, qty, unit, checked, position, added_by)
goals      (id, workspace_id, parent_id, title, description, target_date, progress, status)
journal_entries (id, workspace_id, user_id, date, mood, body)         -- PERSÖNLICH
reminders  (id, workspace_id, entity_type, entity_id, remind_at, channel, sent_at)
```

## Row Level Security (RLS) — Herz der Mandantentrennung

```sql
-- Helper: ist der eingeloggte User Mitglied des Workspaces?
create function is_member(ws uuid) returns boolean
  language sql security definer stable as $$
  select exists(select 1 from workspace_members
    where workspace_id = ws and user_id = auth.uid()) $$;

-- Beispiel tasks: Mitglieder dürfen lesen/schreiben
create policy "members rw" on tasks
  using (is_member(workspace_id)) with check (is_member(workspace_id));

-- Tagebuch ist privat — nur der Autor:
create policy "owner only" on journal_entries
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

> [!tip] Prinzip
> Jede Zeile trägt `workspace_id`. Zugriff nur für Mitglieder. Persönliche Daten (Journal)
> zusätzlich auf `user_id` eingeschränkt. **KISS für 2 Personen, OCP für N später.**

## Konventionen

- UUID-Primärschlüssel, `created_at`/`updated_at` überall.
- Soft-Delete via `archived`, wo sinnvoll (Projekte, Gewohnheiten).
- Migrations versioniert unter `supabase/migrations/`.
- Zod-Schemas (`schema.ts`) spiegeln die Tabellen und werden Client + Edge Functions geteilt.

## Verknüpft

- [[LifeOS_Auth_Und_Workspace|Auth & Workspace]]
- [[LifeOS_Sicherheit|Sicherheit & Datenschutz]]
- [[LifeOS_Architektur|Architektur]]
