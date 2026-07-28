# DB-Audit — Ausführung und Einordnung

`scripts/audit-db.sql` im Supabase-SQL-Editor ausführen (**Dashboard → SQL Editor → New query**,
Inhalt einfügen, *Run*). Das Skript ist read-only.

Es liefert bewusst **ein einziges Ergebnis** mit den Spalten `bereich`, `objekt`, `status`,
`befund` — der SQL-Editor zeigt sonst nur die letzte Anweisung an. Sortiert ist nach `status`:

| `status` | Bedeutung |
|---|---|
| `PROBLEM` | Muss behoben werden, Einordnung je Bereich unten |
| `hinweis` | Unkritisch, aber erwähnenswert |
| `ok` | Wie erwartet |

**Alles in Ordnung, wenn keine Zeile `PROBLEM` zeigt.**

Hintergrund und Fundstellen: Plan „Life OS — Gesamt-Review", Teil A und C.

---

## Bereich 1 — Tabellen-Existenz + RLS

Eine Zeile je Tabelle, die der Client benutzt (31 Stück).

| `befund` | Bedeutung | Konsequenz |
|---|---|---|
| `FEHLT — Migration nachziehen` | Tabelle ist in keiner Migration angelegt und existiert auch nicht in Prod | Modul ist tot. Erwartet für `life_scores`, `workout_*` **nur dann**, wenn sie auch live nie existierten |
| `Tabelle FEHLT` | existiert nicht in Prod | Modul ist tot |
| `RLS AUS` | Tabelle existiert, aber ohne Row Level Security | **Jeder eingeloggte Nutzer liest alle Workspaces.** Sofort beheben |
| `RLS an, aber KEINE Policy` | RLS aktiv, keine Policy definiert | Tabelle ist für alle Clients dicht — Feature liefert leere Listen |

**Der entscheidende Punkt:** Haben `workout_plans`, `workout_exercises`, `workout_logs`,
`workout_set_logs` und `life_scores` RLS **und** mindestens eine Policy? Diese fünf Tabellen sind in
keiner Migration angelegt (dokumentiert in
`supabase/migrations/0000000000007_fitness_f1_exercise_catalog.sql:4-7`) — das Repository kann die
Frage nicht beantworten.

→ **Nächster Schritt, sobald bestätigt ist, dass sie existieren:** Ist-Zustand als
Baseline-Migration nachziehen, damit eine frische Instanz (zweiter Pilot-Haushalt, Staging,
Restore) überhaupt lauffähig ist:

```bash
npx supabase link --project-ref <project-id>
npx supabase db dump --schema public -f supabase/.temp/prod-schema.sql
```

Aus dem Dump nur diese fünf Tabellen samt Constraints, Policies und Indizes übernehmen und als
`supabase/migrations/0000000000024_baseline_fitness_lifescores.sql` idempotent (`if not exists`,
DO-Guards wie in Migration 17) ablegen.

---

## Bereich 2 — Realtime-Publication und replica identity

Eine Zeile je Tabelle, die ein Store per `subscribeToTable()` abonniert (22 Stück).

| `befund` | Bedeutung |
|---|---|
| `NICHT publiziert` | Der Channel wird aufgebaut, es kommt nie ein Event. Kein Live-Sync für dieses Modul |
| `replica identity = d` | INSERT/UPDATE funktionieren, DELETE nicht: Postgres schreibt bei `default` nur den Primärschlüssel ins WAL, der Filter `workspace_id=eq.<id>` in `src/lib/core/realtime.ts:18` verwirft das Event deshalb |
| `publiziert + replica identity full` | wie gewünscht |

`replica identity = default` ist der Auslieferungszustand jeder Tabelle — vor Migration 20 war
das der Normalfall und bestätigt Befund A2. **Nach Migration 20 muss hier jede Zeile `ok` sein.**

Zeilen mit `status = hinweis` listen Tabellen, die publiziert werden, ohne dass ein Client sie
abonniert (z. B. `calendars`, `personal_records`). Unkritisch, kostet nur WAL-Bandbreite.

---

## Bereich 3 — Zeilenanzahl gegen das PostgREST-Limit

PostgREST kappt Antworten bei `max-rows` (Supabase-Default **1000**) und meldet dabei **keinen
Fehler** — der Client bekommt einfach weniger Zeilen als es gibt.

| `status` | Bedeutung |
|---|---|
| `PROBLEM` ab 1000 | Der Datenverlust **war aktiv**: Streaks, Year-in-Pixels, Analytics-Historie und Weekly Review rechneten mit unvollständigen Daten |
| `PROBLEM` ab 900 | Innerhalb weniger Wochen betroffen |
| `ok` | unkritisch |

Am schnellsten wachsen `habit_logs` (Anzahl Routinen × Tage), `workout_set_logs` und
`time_entries`. `exercise_catalog` startet bereits bei 821 Zeilen (wger-Seed).

Seit dem Umbau auf `fetchAllPages()` (`src/lib/core/query.ts`) liest der Client seitenweise — ein
Treffer hier ist deshalb **kein akuter Fehler mehr**, sondern zeigt nur, ab wann die alte
Implementierung Daten verloren hätte. Interessant bleibt es für die Payload-Größe auf Mobilfunk.

---

## Bereich 4 — Index-Abdeckung

Alle Tabellen mit `workspace_id`-Spalte, plus die beiden Fitness-Kindtabellen
(`workout_exercises` → `plan_id`, `workout_set_logs` → `log_id`), die über ihren Parent gelesen
werden statt über `workspace_id`.

Geprüft wird, ob die Spalte **führend** in einem Index steht — ein Index auf `(user_id, date)`
hilft einer Query mit `workspace_id=eq.<id>` nicht.

Jede Feature-Query filtert auf `workspace_id`, zusätzlich prüft die RLS-Policy
`is_member(workspace_id)` pro Zeile. Ohne Index sind das zwei Seq Scans. **Nach Migration 21 muss
hier jede Zeile `ok` sein.**

---

## Zusätzlich: läuft der Reminder-Dispatcher?

Nicht per SQL prüfbar. Ein Aufruf genügt (Token aus `DEPLOY_EDGE_FUNCTION_TODO.md`):

```bash
curl -X POST "https://<project-id>.supabase.co/functions/v1/lifeos-reminder-dispatch" \
  -H "x-lifeos-token: <LIFEOS_INTAKE_TOKEN>" \
  -H "content-type: application/json" \
  -d '{"limit":10}'
```

| Antwort | Bedeutung |
|---|---|
| `404` | Function nicht deployed — Erinnerungen feuern nie |
| `401` | deployed, aber `LIFEOS_INTAKE_TOKEN` stimmt nicht |
| `{"claimed":0,"sent":0,"removed":0,"cleaned":0}` | Function läuft |

Auch wenn die Function antwortet: Es braucht einen **Auslöser**. Ohne `pg_cron`-Job oder n8n-Schedule
wird sie nie von selbst aufgerufen. Prüfen mit:

```sql
select jobid, schedule, command, active from cron.job;
```

Leeres Ergebnis (oder `relation "cron.job" does not exist`) = kein Scheduler aktiv.
