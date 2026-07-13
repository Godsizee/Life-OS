# Claude Code <-> Antigravity CLI (Gemini) lokale Bruecke

## Bekannter Bug (wichtig!)
agy produziert teils LEERE Ausgabe, wenn stdout kein echtes Terminal ist
(z.B. bei Umleitung in eine Datei aus einem Skript/MCP-Server heraus).
Das ist ein dokumentiertes Upstream-Problem. Falls agy_bridge.ps1 oder
agy_bridge.sh eine leere result-Ausgabe liefern:

  - Linux/macOS/WSL: "script -qec 'agy ...' /dev/null" als PTY-Workaround
    nutzen, oder das Python-Paket "agy-headless-bridge" installieren
    (pip install agy-headless-bridge) - das wrapped agy automatisch in
    ein Pseudo-Terminal und bereinigt die TUI-Ausgabe.
  - Windows: ConPTY-basierte Alternative pruefen, z.B. ueber dasselbe
    "agy-headless-bridge"-Paket, das laut eigener Doku sowohl Windows
    ConPTY als auch POSIX-PTY unterstuetzt.

## Tatsaechliche agy-Flags (verifiziert aus "agy --help")
  --print / -p                        Einmaliger Prompt, non-interaktiv
  --dangerously-skip-permissions      Keine Bestaetigungs-Prompts
  --print-timeout                     Go-Duration-Format, z.B. "120s"
  --model                             Optional festes Modell
  --add-dir                           Zusaetzliche Arbeitsverzeichnisse
  --sandbox                           Terminal-Restriktionen aktivieren

## Dateien
- agy_bridge.sh    -> Linux/macOS/WSL
- agy_bridge.ps1   -> natives Windows (PowerShell)
- delegate_to_gemini.py -> MCP-Server, waehlt Skript automatisch per OS
- .mcp.json (Projekt-Root) -> Registrierung bei Claude Code

## Installation
1. Alle Dateien nach .claude/ im Projekt kopieren (ausser .mcp.json -> Projekt-Root).
2. .mcp.json Pfade pruefen: "python" statt "python3" unter Windows, falls noetig.
3. Claude Code im Projektordner neu starten.

## Manueller Test VOR Claude-Integration
Windows: .\.claude\agy_bridge.ps1 -Prompt "Sag in einem Satz, welches Datum heute ist."
Erwartete Ausgabe: einzeiliges JSON mit "status":"ok".

Falls "status":"error" mit Hinweis auf leere Ausgabe erscheint: siehe TTY-Bug oben.

## Nutzung aus Claude heraus
"Nutze delegate_to_gemini und lass Gemini <Aufgabe> pruefen/recherchieren/planen.
 Arbeite danach mit dem Ergebnis weiter."

## Nach Aenderungen an delegate_to_gemini.py
Der MCP-Server laeuft als bereits gestarteter Python-Prozess (per stdio von Claude Code
gespawnt). Code-Aenderungen auf der Platte wirken sich erst nach einem Neustart dieses
Prozesses aus - Claude Code neu starten oder die MCP-Verbindung trennen/neu verbinden,
sonst nutzt Claude weiterhin die alte Tool-Signatur/Logik.

## Sicherheitshinweise
- --dangerously-skip-permissions erlaubt agy, Datei-/Terminal-Aktionen OHNE
  Rueckfrage auszufuehren. Nur in Projekten nutzen, denen du vertraust.
  Kombiniere bei Bedarf mit --sandbox, wenn Gemini nur lesen/planen soll.
- Claude und Gemini sollten nicht gleichzeitig im selben Git-Worktree schreiben.
- agy und die Antigravity-Desktop-App teilen sich ein Nutzungskontingent.