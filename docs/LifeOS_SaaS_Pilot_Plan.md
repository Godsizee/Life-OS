---
title: Life OS — SaaS-Pilot-Plan (P0–P4)
tags: [lifeos, saas, pilot, beta, roadmap, planung]
aliases: [SaaS-Plan, Pilot-Plan, Beta-Plan, P0-P4]
created: 2026-07-06
status: aktiv
---

# Life OS — SaaS-Pilot-Plan (P0–P4)

> [!important] Scope-Änderung (User-Entscheid 2026-07-06)
> Dieses Dokument **ersetzt** die bisherige Begrenzung „v1 = 2 Personen, SaaS später"
> ([[00_LifeOS_Konzept|Konzept]]) sowie „M5 SaaS: später" ([[LifeOS_Roadmap|Roadmap]]).
> Neues Ziel: **geschlossener Pilot mit wenigen echten Haushalten, danach zahlungsfähiger SaaS.**
> Das Konzept bleibt veränderbare Grundlage. Unverändert gelten: FairShare-Abgrenzung,
> Architektur-Prinzipien (KISS/OCP/SRP), Mobile First <360px/≥360px.

## Ziel & Leitplanken

- **Pilot:** 5–15 Haushalte (10–30 Nutzer), geschlossene Beta über Einladungscodes, 4 Wochen, kostenlos.
- **Frictionless:** Signup → erste Aufgabe in **< 60 s**; Partner-Invite-Link → gemeinsamer Workspace in **< 90 s**. Ein Auth-Weg, kein Passwort-Zwang, keine Sackgassen.
- **Mobile First:** alle Flüsse auf **320 / 360 / 390 / 430 px** getestet (Playwright + 2 echte Geräte), kein horizontales Scrollen, Touch ≥ 48 px.
- **Zeitachse:** P0+P1+P2 ≈ 3 Wochen → Pilot-Start ~KW 31 (Ende Juli 2026) → 4 Wochen Pilot → Go/No-Go → P4 SaaS-Ausbau → Public Beta ~Ende September 2026.

## Ist-Stand (Code-Audit 2026-07-06)

**Läuft (M0–M3 implementiert):** Alle 7 Module mit Repository-Pattern + Realtime + Offline-Outbox,
Workspace/RLS-Migrations, PWA (Install-Prompt, Service Worker mit Push-Handlern, Sync-Banner),
16 Unit-Tests grün.

**Nie verifiziert:** Kein Durchstich mit echtem Supabase-Projekt — der manuelle Klick-Test aus
`Recent.md` steht seit M2 aus. **Das ist Blocker Nr. 1.**

> [!bug] Kritische Friction-Befunde (Code-Audit)
> 1. **Invite-Loop ist tot:** `inviteMember()` ([api.ts](../src/lib/features/workspace/api.ts)) erzeugt den Token, aber die UI zeigt ihn nie an und es geht keine E-Mail raus → Partner kann faktisch nicht beitreten.
> 2. **Invite-Token geht verloren:** `/invite?token=…` ohne Session verweist auf `/login` **ohne Rücksprung** — nach dem Login landet der Partner im eigenen leeren Workspace statt in der Einladung.
> 3. **Signup kollidiert mit E-Mail-Bestätigung:** `signUp()` → sofort `goto('/')`; mit aktivierter Confirm-Mail (Supabase-Default) hängt der Nutzer ohne Erklärung.
> 4. **Kein Passwort-Reset** — wer das Passwort vergisst, ist ausgesperrt.
> 5. **Supabase-Default-SMTP** erlaubt nur eine Handvoll Mails/Stunde — reicht nicht einmal für 2 Tester.

## Frictionless-Funnel (Zielbild)

| Schritt | Zielzustand | Zielzeit |
|---|---|---|
| Landing/Login | 1 Feld (E-Mail) + Beta-Code (aus Link vorausgefüllt) | 10 s |
| Auth | 6-stelliger E-Mail-OTP-Code — kein Passwort, kein Confirm-Link, PWA-sicher | 20 s |
| Onboarding | 2 Fragen: Anzeigename + „Wie heißt euer Haushalt?" → fertig | 15 s |
| Erste Aktion | Empty-States mit je 1 CTA („Erste Aufgabe", „Partner einladen") | 15 s |
| Partner-Loop | Teilbarer Invite-Link (Web-Share/WhatsApp) → OTP → Auto-Join in den Workspace | < 90 s |

E-Mail-OTP statt Magic-Link ist bewusst: Magic-Links brechen auf iOS aus der installierten PWA
in den Safari-Kontext aus (Session-Mismatch); ein Code funktioniert überall.

---

## P0 — Produktionsreife & erster Durchstich (2–4 Tage)

- [ ] Supabase-Projekt **EU (Frankfurt)** anlegen, `supabase db push` (5 Migrations), Site-/Redirect-URLs setzen
- [ ] Lokale `.env` + **manueller Klick-Test aller Module** (offener Punkt aus `Recent.md`) → Bugliste
- [ ] **Custom SMTP** (Resend oder Brevo, eigene Domain, SPF/DKIM) in Supabase Auth hinterlegen
- [ ] Deploy: **Vercel** + `@sveltejs/adapter-vercel` (statt `adapter-auto`), Domain + HTTPS, Env-Vars; Preview-Deployments als Staging
- [ ] CI (GitHub Actions): `check` + `test` + `build` auf jedem PR; Migrations-Push auf `main`
- [ ] **Sentry** (SvelteKit-SDK) + UptimeRobot-Ping; ESLint + Prettier nachziehen (laut [[LifeOS_Deployment|Deployment]] geplant, fehlt)
- [ ] Doku angleichen: `AGENTS.md`-Projektstatus (behauptet „kein Code"), [[00_LifeOS_Konzept|Konzept]] „Für wen" → Pilot-Beta, [[LifeOS_Roadmap|Roadmap]] → Verweis hierher

**DoD:** Auf fremdem Gerät mit frischer E-Mail: Registrieren → Aufgabe anlegen → zweites Gerät
sieht sie via Realtime — auf der Produktions-URL.

## P1 — Frictionless Onboarding (~1 Woche)

- [ ] **Auth auf E-Mail-OTP umstellen** (`signInWithOtp` + `verifyOtp` in [login/+page.svelte](../src/routes/login/+page.svelte)): ein Flow für Signup & Login; Passwort-Modus entfernen (KISS — es gibt erst 2 Bestandskonten)
- [ ] **Beta-Gate:** `beta_codes`-Tabelle; `handle_new_user`-Trigger erweitert — Signup nur mit gültigem `beta_code` **oder** gültigem Invite-Token in `options.data`; Codes einmal pro Haushalt
- [ ] **Invite-Loop reparieren:** Invite-Link (`/invite?token=…`) nach Erstellung anzeigen — Kopier-Button + Web-Share-API (WhatsApp-tauglich); offene Einladungen in `MemberList` mit Status
- [ ] **Invite-Deep-Link härten:** Token übersteht den Login-Umweg (`/login?next=…` oder sessionStorage in [invite/+page.svelte](../src/routes/invite/+page.svelte)); nach OTP-Verify automatisch `accept_invite` → direkt im geteilten Workspace
- [ ] **Onboarding-Schritt** nach erstem Login: Anzeigename + Workspace-Name (ersetzt `email's Workspace` aus Migration 0001); danach 2 CTAs: Partner einladen / Erste Aufgabe
- [ ] **Empty-States** je Modul: 1 Satz + 1 Aktion (statt leerer Listen)
- [ ] **Feedback-Kanal:** `feedback`-Tabelle (insert-only RLS) + Formular unter „Mehr"; Fallback mailto
- [ ] **First-Party-Telemetrie:** `events`-Tabelle (user, workspace, name, props, ts) + ~10 Events (signup, workspace_named, invite_sent/accepted, task_created, module_opened, pwa_installed, return_d1/d7); Auswertung = SQL, kein Drittanbieter, kein Cookie-Banner
- [ ] **Legal-Minimum:** `/legal/impressum` + `/legal/datenschutz` (statisch), verlinkt in Login-Footer + „Mehr"; AVV mit Supabase/Vercel/Resend abschließen

**DoD:** Neuer Nutzer kommt per Invite-Link auf einem 320-px-Gerät in < 90 s in den geteilten
Workspace; kompletter Funnel in Telemetrie sichtbar.

## P2 — Mobile-Härtung & Qualität (~1 Woche, überlappt P1)

- [ ] **Playwright** einrichten; Viewport-Matrix **320/360/390/430** (offener Punkt seit M2); Smoke-Flows: OTP-Login (lokale Supabase/Inbucket), Task-CRUD, Einkauf abhaken, Invite-Annahme
- [ ] Assert je Route: `document.scrollWidth ≤ viewport` (kein horizontaler Overflow)
- [ ] [[LifeOS_Frontend_Guidelines|Frontend-Guidelines]] durchziehen: `xs: 360px`-Breakpoint, `clamp()`-Typo, Container-Queries für Karten, Touch-Target-Audit ≥ 48 px
- [ ] **2 echte Geräte:** Android/Chrome + iOS/Safari — PWA-Install, Safe-Area, OTP-Flow, Push (iOS ≥ 16.4, nur installiert)
- [ ] **RLS-Negativtests** als SQL-Skript in CI (User A darf Workspace B nicht lesen; Journal nur Autor)
- [ ] A11y-Basics: bekannte InviteForm-Label-Warnung fixen, Fokusreihenfolge, Kontrast; Lighthouse mobil ≥ 90 (optional als CI-Budget)

**DoD:** Testmatrix grün auf 4 Breiten; Kernflüsse auf beiden echten Geräten fehlerfrei.

## P3 — Pilotbetrieb (4 Wochen)

**Setup:**
- [ ] **Supabase Pro** (25 $/Mo) ab Pilot-Start — Free-Tier hat **keine Backups** und pausiert bei Inaktivität; im Piloten liegen private Tagebuch-Daten
- [ ] Restore-Test einmal durchspielen ([[LifeOS_Sicherheit|Sicherheit]]: „Restore testen")
- [ ] Rekrutierung: 5–15 Haushalte (Paare/WGs) aus Umfeld + Warteliste; pro Haushalt 1 Beta-Code; Erwartung setzen: Beta, Feedback erwünscht, Daten in EU, Löschung jederzeit auf Zuruf

**Rhythmus:**
- [ ] Wöchentlich: Metrik-Review (SQL auf `events`) + Feedback-Triage → **1 Release/Woche**, strikt aus Feedback priorisiert (kein Scope-Creep)
- [ ] **Retention-Features nachschieben** (M4-Subset, ab Pilot-Woche 2): Push-Versand-Edge-Function (liest `push_subscriptions`, `VAPID_PRIVATE_KEY`) für Aufgaben-Reminder + Morgen-Digest; serverseitige RRULE-Expansion via **pg_cron + Edge Function** — n8n erst, wenn externe Integrationen (Telegram/ICS) wirklich gebraucht werden

**Go/No-Go-Kriterien (Ende Pilot):**

| Metrik | Ziel |
|---|---|
| Aktivierung: 2. Mitglied im Workspace ≤ 72 h | ≥ 70 % der Haushalte |
| Kern-Nutzung: aktive Tage/Woche pro Haushalt | ≥ 3 |
| Retention Woche 4 | ≥ 50 % der Haushalte aktiv |
| Qualität | Crash-free ≥ 99 %, 0 RLS-Vorfälle, Sync-Fehler < 1 % |
| Zahlungsbereitschaft (Abschluss-Interview) | ≥ 40 % „ja" bei ~4 €/Monat |

## P4 — SaaS-Ausbau (nach Go, ~2–3 Wochen)

- [ ] **Pricing:** Free = 1 Workspace, 1 Mitglied, Kernmodule; **„Haushalt" ≈ 3,99 €/Monat oder 36 €/Jahr pro Workspace** (flat — einer zahlt, keine Sitzplatzrechnung); Pilot-Teilnehmer erhalten Founding-Preis
- [ ] **Stripe:** Checkout + Customer Portal + Webhook-Edge-Function → `workspaces.plan`; Gating über Modul-Registry (`plan`-Feld in [modules.ts](../src/lib/config/modules.ts) existiert) **plus** serverseitige Limits (Trigger/RLS, nicht nur UI)
- [ ] **Konto & Daten (Launch-Blocker, DSGVO Art. 17/20):** Konto löschen (Kaskade + Auth-User), Workspace löschen, JSON-Export
- [ ] **Landing Page:** unauthentifiziertes `/` = Wertversprechen („Euer gemeinsamer Alltag in einer App"), Screenshots, Preis, Signup; authentifiziert = Heute-Dashboard
- [ ] Lifecycle-Mails (Welcome, Tag-3-Tipp, Wochen-Digest) via Resend + pg_cron
- [ ] Hosting kommerziell: **Vercel Pro** (Hobby-Plan erlaubt keine kommerzielle Nutzung — im kostenlosen Pilot ok, ab Bezahlung nicht) oder Wechsel auf Cloudflare
- [ ] OAuth (Google/Apple) aus dem v2-Backlog vorziehen, wenn Pilot-Feedback OTP-Hürden zeigt

## Betrieb, Kosten, DSGVO

- **Pilot-Kosten:** Supabase Pro 25 $/Mo + Domain ~10 €/Jahr; Vercel Hobby, Resend Free (3k Mails/Mo), Sentry Free, UptimeRobot Free → **≈ 25–30 €/Monat**.
- **DSGVO:** EU-Region ab Tag 1; AVVs (Supabase, Vercel, Resend); Datenschutzerklärung + Impressum ab P1; first-party-Telemetrie ohne Cookies → kein Consent-Banner; Journal bleibt RLS-owner-only; Löschung im Pilot manuell zugesichert, ab P4 self-service.
- **Backups:** täglich (Pro-Plan) + Restore-Test vor Pilot-Start.

## Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Zweiseitiges Onboarding scheitert (Partner kommt nie an) | Invite-Loop ist P1-Kernstück; Funnel-Events messen jeden Schritt |
| E-Mail-Zustellbarkeit (OTP hängt an SMTP) | Eigene Domain + SPF/DKIM in P0, nicht erst im Pilot |
| iOS-PWA-Eigenheiten (Push erst ≥ 16.4; Safari räumt Storage nach ~7 Tagen Inaktivität) | Outbox klein halten, Sync-Status sichtbar (existiert), Erwartung in Onboarding-Mail |
| Supabase-Free-Pause / Datenverlust | Pro-Plan ab Pilot-Start (P3) |
| Scope-Creep während Pilot | Wochen-Releases nur aus Feedback-Triage; v2-Backlog bleibt zu |

## Entscheidungen (Empfehlung = Default, Einspruch jederzeit)

1. **Nur E-Mail-OTP**, Passwort-Login entfällt (KISS, PWA-sicher).
2. **Supabase Pro ab Pilot-Start** (Backups + keine Pause) — 25 $/Mo.
3. **Kein n8n im Pilot** — pg_cron + Edge Functions reichen; n8n erst für externe Integrationen.
4. **Keine Analytics-Suite im Pilot** — first-party `events`-Tabelle + SQL; PostHog EU erst ab Public Beta.
5. **Eine Domain** — unauth `/` = Landing (P4), vorher genügt die Login-Seite mit 3 Sätzen Wertversprechen.

## Doku-Folgeänderungen (Teil von P0)

- [[00_LifeOS_Konzept|Konzept]]: „Für wen" → „v1: geschlossene Pilot-Beta (Haushalte à 2 Personen), SaaS-Pfad aktiv"
- [[LifeOS_Roadmap|Roadmap]]: M4/M5 durch P0–P4 ersetzt (Verweis eingefügt)
- `AGENTS.md`: Projektstatus korrigieren (Code existiert, M0–M3 fertig, aktueller Schritt = P0)

## Verknüpft

- [[00_LifeOS_Konzept|Konzept & Scope]] · [[LifeOS_Roadmap|Roadmap]] · [[LifeOS_Deployment|Deployment]]
- [[LifeOS_Auth_Und_Workspace|Auth & Workspace]] · [[LifeOS_Frontend_Guidelines|Frontend Guidelines]] · [[LifeOS_Sicherheit|Sicherheit]]
