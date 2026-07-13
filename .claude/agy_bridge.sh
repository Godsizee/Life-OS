#!/usr/bin/env bash
#
# agy_bridge.sh — Headless bridge fuer die Antigravity CLI (agy).
# ACHTUNG: agy hat einen bekannten Bug, der bei umgeleitetem stdout
# (kein echtes TTY) leere Ausgabe produzieren kann. Falls das auftritt,
# "agy-headless-bridge" (pip install agy-headless-bridge) als PTY-Wrapper nutzen.
#
# Aufruf: ./agy_bridge.sh "Dein Prompt fuer Gemini"
# Rueckgabe (stdout): { "task_id": "...", "status": "ok|error|timeout", "result": "...", "raw_file": "..." }
# Exit Codes: 0=ok, 1=Fehler, 2=Timeout, 3=Lock-Fehler

set -euo pipefail

PROMPT="${1:-}"
if [[ -z "$PROMPT" ]]; then
  echo '{"status":"error","result":"Kein Prompt uebergeben. Aufruf: agy_bridge.sh \"Prompt-Text\""}'
  exit 1
fi

WORKDIR="${AGY_BRIDGE_DIR:-$HOME/.agy-bridge}"
LOCKFILE="$WORKDIR/agy.lock"
PRINT_TIMEOUT="${AGY_BRIDGE_TIMEOUT:-120s}"
MODEL="${AGY_BRIDGE_MODEL:-}"

mkdir -p "$WORKDIR/results" "$WORKDIR/logs"

TASK_ID="$(date +%Y%m%dT%H%M%S)-$$-$RANDOM"
OUTFILE="$WORKDIR/results/agy-result-$TASK_ID.txt"
ERRFILE="$WORKDIR/logs/agy-error-$TASK_ID.log"

exec 9>"$LOCKFILE"
if ! flock -w 30 9; then
  echo "{\"task_id\":\"$TASK_ID\",\"status\":\"error\",\"result\":\"Lock timeout: anderer agy-Lauf blockiert\"}"
  exit 3
fi

AGY_ARGS=(--print "$PROMPT" --dangerously-skip-permissions --print-timeout "$PRINT_TIMEOUT")
if [[ -n "$MODEL" ]]; then
  AGY_ARGS+=(--model "$MODEL")
fi

set +e
# Falls "agy" hier leere Ausgabe produziert (bekannter TTY-Bug),
# stattdessen testen: script -qec "agy ${AGY_ARGS[*]}" /dev/null > "$OUTFILE" 2> "$ERRFILE"
agy "${AGY_ARGS[@]}" < /dev/null > "$OUTFILE" 2> "$ERRFILE"
RC=$?
set -e

flock -u 9

if [[ $RC -ne 0 ]]; then
  ERRMSG="$(tail -c 2000 "$ERRFILE" 2>/dev/null | tr -d '\n' | sed 's/"/\\"/g')"
  if echo "$ERRMSG" | grep -qiE "timeout|deadline"; then
    echo "{\"task_id\":\"$TASK_ID\",\"status\":\"timeout\",\"result\":\"agy Timeout: $ERRMSG\",\"raw_file\":\"$OUTFILE\"}"
    exit 2
  fi
  echo "{\"task_id\":\"$TASK_ID\",\"status\":\"error\",\"result\":\"agy exit code $RC: $ERRMSG\",\"raw_file\":\"$OUTFILE\"}"
  exit 1
fi

RESULT_TEXT="$(cat "$OUTFILE" | tr -d '\n' | sed 's/"/\\"/g')"
if [[ -z "$RESULT_TEXT" ]]; then
  echo "{\"task_id\":\"$TASK_ID\",\"status\":\"error\",\"result\":\"Leere Ausgabe von agy - vermutlich TTY-Bug. Siehe Kommentar im Skript (script -qec Workaround oder agy-headless-bridge nutzen).\",\"raw_file\":\"$OUTFILE\"}"
  exit 1
fi

echo "{\"task_id\":\"$TASK_ID\",\"status\":\"ok\",\"result\":\"$RESULT_TEXT\",\"raw_file\":\"$OUTFILE\"}"
exit 0