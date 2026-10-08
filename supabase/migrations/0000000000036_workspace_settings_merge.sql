-- Haushalts-Einstellungen zusammenführen statt überschreiben.
--
-- HINTERGRUND: shopping/api.ts:upsertWorkspaceSettings schrieb das KOMPLETTE
-- settings-Objekt. Ändern zwei Haushaltsmitglieder kurz nacheinander je einen
-- anderen Wert (Ladenlayout / Stammartikel), überschreibt das langsamere das
-- schnellere — derselbe Fehler, den Migration 32 für profiles behoben hat.
-- `||` führt auf oberster Ebene zusammen; Einstellungen sind deshalb flach.
--
-- security invoker: Die RLS-Policy "members rw" auf workspace_settings bleibt
-- maßgeblich (Insert und Update nur für Mitglieder).
-- Idempotent (create or replace).

create or replace function public.merge_workspace_settings(ws uuid, patch jsonb)
returns jsonb
language sql
security invoker
as $$
  insert into public.workspace_settings (workspace_id, settings, updated_at)
  values (ws, coalesce(patch, '{}'::jsonb), timezone('utc'::text, now()))
  on conflict (workspace_id) do update
     set settings   = coalesce(public.workspace_settings.settings, '{}'::jsonb)
                      || coalesce(excluded.settings, '{}'::jsonb),
         updated_at = excluded.updated_at
  returning settings;
$$;

grant execute on function public.merge_workspace_settings(uuid, jsonb) to authenticated;
