-- Einstellungen zusammenfuehren statt ersetzen.
--
-- HINTERGRUND: Der Client schrieb bisher bei jeder Aenderung das KOMPLETTE
-- settings-Objekt (`update profiles set settings = <alles>`). Aendern zwei
-- Geraete kurz nacheinander je eine andere Einstellung, ueberschreibt das
-- langsamere die Aenderung des schnelleren mit seinem eigenen, aelteren Stand.
-- Mit dem Offline-Outbox-Weg wird das haeufiger: eine Mutation kann Stunden
-- spaeter abgespielt werden und wuerde dann alles dazwischen zuruecksetzen.
--
-- Der jsonb-Operator `||` fuehrt auf oberster Ebene zusammen: nur die Keys im
-- Patch werden gesetzt, alle anderen bleiben unveraendert. Damit ist das
-- Abspielen einer alten Mutation auch verlustfrei.

create or replace function merge_profile_settings(patch jsonb)
returns jsonb
language sql
security invoker
as $$
  update profiles
     set settings = coalesce(settings, '{}'::jsonb) || coalesce(patch, '{}'::jsonb)
   where user_id = auth.uid()
  returning settings;
$$;

-- security invoker: die bestehende RLS-Policy auf `profiles` bleibt massgeblich,
-- die Funktion umgeht sie nicht. `auth.uid()` stellt zusaetzlich sicher, dass
-- niemand fremde Profile patchen kann, auch nicht mit manipulierten Parametern.
grant execute on function merge_profile_settings(jsonb) to authenticated;
