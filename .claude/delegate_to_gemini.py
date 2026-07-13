#!/usr/bin/env python3
"""
delegate_to_gemini.py — MCP-Server (FastMCP), Subprocess-Aufruf laeuft
in einem Thread-Pool, damit der asyncio-Event-Loop waehrend des
Wartens auf Gemini nicht blockiert wird.
"""

import subprocess
import os
import platform
import json
import anyio
from mcp.server.fastmcp import FastMCP

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
IS_WINDOWS = platform.system() == "Windows"

BRIDGE_SH = os.environ.get("AGY_BRIDGE_SH", os.path.join(SCRIPT_DIR, "agy_bridge.sh"))
BRIDGE_PS1 = os.environ.get("AGY_BRIDGE_PS1", os.path.join(SCRIPT_DIR, "agy_bridge.ps1"))

mcp = FastMCP("gemini-bridge")

# Modellwahl nach Aufgabentyp (siehe CLAUDE.md fuer die volle Begruendung/Benchmarks).
# "quick" ist bewusst der Default: bei der synchron blockierenden Bridge zaehlt Latenz,
# und Flash schlaegt Pro sogar bei den meisten agentischen/Tool-Use-Aufgaben.
QUICK_MODEL = "Gemini 3.5 Flash (High)"
DEEP_MODEL = "Gemini 3.1 Pro (High)"

def _run_bridge_sync(prompt: str, timeout_seconds: int, model: str) -> str:
    env = os.environ.copy()
    env["AGY_BRIDGE_TIMEOUT"] = f"{timeout_seconds}s"
    if model:
        env["AGY_BRIDGE_MODEL"] = model

    try:
        if IS_WINDOWS:
            cmd = ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
                   "-File", BRIDGE_PS1, "-Prompt", prompt]
        else:
            cmd = ["bash", BRIDGE_SH, prompt]

        proc = subprocess.run(
            cmd, capture_output=True, text=True,
            timeout=timeout_seconds + 15, env=env,
        )
        stdout = proc.stdout.strip() or "{}"
        try:
            parsed = json.loads(stdout)
        except json.JSONDecodeError:
            return f"Ungueltiges JSON von bridge: {stdout}"

        return parsed.get("result", "Keine Antwort erhalten.")

    except subprocess.TimeoutExpired:
        return f"Timeout nach {timeout_seconds}s beim Warten auf Gemini."
    except Exception as e:
        return f"Fehler beim Aufruf der Bridge: {e}"

@mcp.tool()
async def delegate_to_gemini(
    prompt: str, task_type: str = "quick", timeout_seconds: int = 120, model: str = ""
) -> str:
    """Delegiert eine Teilaufgabe synchron an den Gemini-Agenten (Antigravity CLI 'agy',
    headless via --print) und liefert dessen Antwort zurueck. Blockiert bis Gemini
    fertig ist oder ein Timeout eintritt. Laeuft in einem Thread, damit der Server
    waehrenddessen weiterhin auf andere Nachrichten reagieren kann.

    task_type waehlt automatisch das passende Modell:
      - "quick" (Default): Gemini 3.5 Flash (High). Schneller (~3.6x) und guenstiger als Pro,
        UND staerker bei Recherche, Code-/Datei-Checks, agentischen Tool-Use-Aufgaben
        (SWE-Bench, Terminal-Bench, Finance/Legal-Agent-Tasks) sowie Multimodal (Bilder/Screenshots).
        Fuer die allermeisten Delegationen die richtige Wahl.
      - "deep": Gemini 3.1 Pro (High). Langsamer und teurer, aber staerker bei echtem
        mehrstufigem Reasoning (Architekturentscheidungen, unklare Bugs mit vielen moeglichen
        Ursachen) und bei Long-Context-Retrieval ueber sehr grosse Dokumente/Codebasen.
        Nur gezielt einsetzen, wenn "quick" nicht ausreicht oder als Zweitmeinung.

    model ueberschreibt task_type, falls ein bestimmtes Modell erzwungen werden soll
    (exakter Name wie von 'agy models' gelistet, z.B. "Gemini 3.1 Pro (Low)")."""
    resolved_model = model or (DEEP_MODEL if task_type == "deep" else QUICK_MODEL)
    return await anyio.to_thread.run_sync(
        _run_bridge_sync, prompt, timeout_seconds, resolved_model
    )

if __name__ == "__main__":
    mcp.run()