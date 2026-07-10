---
title: Life OS — Sicherheit & Datenschutz
tags: [lifeos, security, datenschutz, rls, betrieb]
aliases: [Sicherheit, Datenschutz, Betrieb, Backups]
created: 2026-06-23
status: planung
---

# Life OS — Sicherheit & Datenschutz

## Verantwortlichkeitsverteilung

```
Frontend          → normale Nutzerinteraktion
Supabase + Edge   → verbindliche Geschäftslogik & Berechtigungen
n8n (optional)    → Integrationen & Orchestrierung
Externe Dienste   → nur notwendige Daten & minimale Rechte
```

## Zugriffskontrolle

- **RLS auf jeder Tabelle** — Zugriff nur für Workspace-Mitglieder (`is_member`).
- **Persönliche Daten** (Tagebuch) nur für den Autor (`user_id = auth.uid()`).
- Keine öffentliche Tabelle; sensible Rohdaten begrenzen.
- Siehe [[LifeOS_Datenmodell|Datenmodell & RLS]].

## Service-Zugänge (n8n / Edge)

- ✅ eigener Token pro Quelle, geringstmögliche Rechte, regelmäßig rotieren
- ✅ nur serverseitig in n8n-Credentials, **nie** im Browser/Repo
- ✅ HTTPS erzwingen, Rate Limits, Audit-Log
- optional: HMAC-Signatur, Zeitstempel, Nonce/Idempotency-Key, IP-Allowlist

## Datenminimierung

- Nur notwendige Felder speichern; externe IDs + Dublettenschlüssel.
- Rohdaten externer Quellen (ICS, E-Mail) nur zeitlich begrenzt aufbewahren.
- Keine unverschlüsselten Tokens, keine Secrets in Logs.

## Offline-Daten

- Outbox nutzerbezogen, **bei Logout leeren**, keine Vermischung zwischen Nutzern.
- Konflikte nicht still überschreiben — Sync-Status anzeigen.
- IndexedDB statt `localStorage`; lokale Daten auf geteilten Geräten minimieren.

## Backups & Monitoring

- Regelmäßiger (verschlüsselter) Export, getrenntes Ziel, Rotation, **Restore testen**.
- Statuswerte sichtbar: letzte Synchronisierung, letzter Import, neue Vorschläge, letztes Backup.
- **Keine stillen Fehler** — verständliche Fehlercodes und Hinweise.

## .gitignore (Pflicht)

`.env*`, Build-Ordner (`/.svelte-kit`, `/build`, `/dist`), lokale Supabase-Daten —
**niemals** committen.

## Verknüpft

- [[LifeOS_N8n_Automatisierung|n8n-Automatisierung]]
- [[LifeOS_Auth_Und_Workspace|Auth & Workspace]]
- [[LifeOS_Deployment|Deployment]]
