param(
    [Parameter(Mandatory = $true)]
    [string]$Prompt
)

$WorkDir = if ($env:AGY_BRIDGE_DIR) { $env:AGY_BRIDGE_DIR } else { "$HOME\.agy-bridge" }
$PrintTimeout = if ($env:AGY_BRIDGE_TIMEOUT) { $env:AGY_BRIDGE_TIMEOUT } else { "120s" }
$Model = $env:AGY_BRIDGE_MODEL

function Convert-GoDurationToMs {
    param([string]$Duration)
    if ([string]::IsNullOrWhiteSpace($Duration)) { return 120000 }
    $TotalSeconds = 0
    foreach ($M in [regex]::Matches($Duration, '(\d+)(h|m|s)')) {
        $Value = [int]$M.Groups[1].Value
        switch ($M.Groups[2].Value) {
            'h' { $TotalSeconds += $Value * 3600 }
            'm' { $TotalSeconds += $Value * 60 }
            's' { $TotalSeconds += $Value }
        }
    }
    if ($TotalSeconds -le 0) { return 120000 }
    return $TotalSeconds * 1000
}

# Harte Obergrenze fuer den agy-Prozess: agys eigenes --print-timeout wird ihm zwar
# mitgegeben, greift aber nicht zuverlaessig, wenn der Prozess vor Erreichen seiner
# eigenen Timeout-Logik haengt (z.B. Warten auf stdin nach Login-Fehler). Deshalb
# erzwingt dieses Skript selbst ein Prozess-Kill, mit 20s Gnadenfrist zusaetzlich
# zu agys eigenem Timeout.
$HardTimeoutMs = (Convert-GoDurationToMs $PrintTimeout) + 20000

New-Item -ItemType Directory -Force -Path "$WorkDir\results" | Out-Null
New-Item -ItemType Directory -Force -Path "$WorkDir\logs" | Out-Null

# Leere Datei als stdin-Quelle: verhindert, dass agy.exe auf eine interaktive
# Eingabe (z.B. Login-/Consent-Prompt) wartet und dadurch unbegrenzt haengt.
$EmptyStdinFile = "$WorkDir\empty_stdin.txt"
if (-not (Test-Path $EmptyStdinFile)) {
    New-Item -ItemType File -Force -Path $EmptyStdinFile | Out-Null
}

$TaskId = "{0}-{1}" -f (Get-Date -Format "yyyyMMddTHHmmss"), (Get-Random)
$OutFile = "$WorkDir\results\agy-result-$TaskId.txt"
$ErrFile = "$WorkDir\logs\agy-error-$TaskId.log"
$LogFile = "$WorkDir\logs\agy-run-$TaskId.log"

$MutexName = "Global\AgyBridgeLock"
$Mutex = New-Object System.Threading.Mutex($false, $MutexName)
$Acquired = $Mutex.WaitOne(30000)

if (-not $Acquired) {
    [PSCustomObject]@{ task_id = $TaskId; status = "error"; result = "Lock timeout: anderer agy-Lauf blockiert" } | ConvertTo-Json -Compress
    exit 3
}

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8

    $EscapedPrompt = $Prompt -replace '"', '\"'
    $ArgString = "--print `"$EscapedPrompt`" --dangerously-skip-permissions --print-timeout $PrintTimeout --log-file `"$LogFile`""
    if ($Model) { $ArgString += " --model `"$Model`"" }

    $MaxAttempts = 3
    $RC = 1
    $TimedOut = $false
    for ($Attempt = 1; $Attempt -le $MaxAttempts; $Attempt++) {
        $TimedOut = $false
        $Proc = Start-Process -FilePath "agy" -ArgumentList $ArgString `
            -RedirectStandardOutput $OutFile -RedirectStandardError $ErrFile `
            -RedirectStandardInput $EmptyStdinFile `
            -NoNewWindow -PassThru

        $Finished = $Proc.WaitForExit($HardTimeoutMs)
        if (-not $Finished) {
            $TimedOut = $true
            try { & taskkill /PID $Proc.Id /T /F | Out-Null } catch {}
            Start-Sleep -Milliseconds 300
            $RC = -1
        } else {
            $RC = $Proc.ExitCode
        }
        Start-Sleep -Milliseconds 500

        # Bekannter agy-Bug: stdout bleibt manchmal leer trotz Exit-Code 0.
        # Bei leerer Ausgabe automatisch erneut versuchen.
        if ($RC -eq 0 -and (Test-Path $OutFile) -and ((Get-Item $OutFile).Length -gt 0)) {
            break
        }

        # Bei eindeutigem Login-Fehler ist ein Retry deterministisch sinnlos.
        if ((Test-Path $LogFile) -and ((Get-Item $LogFile).Length -gt 0)) {
            $LogProbe = [System.IO.File]::ReadAllText($LogFile, [System.Text.Encoding]::UTF8)
            if ($LogProbe -match 'not logged into Antigravity') { break }
        }
    }
} finally {
    $Mutex.ReleaseMutex()
}
Start-Sleep -Milliseconds 500

# Primaer aus stdout (OutFile) lesen - das ist die eigentliche Modellantwort.
# Status ist nur dann "ok", wenn tatsaechlich eine Modellantwort vorliegt - ein
# stiller Log-Fallback als "ok" wuerde echte Fehler (z.B. Login) verschleiern.
$StatusValue = "ok"
if ((Test-Path $OutFile) -and ((Get-Item $OutFile).Length -gt 0)) {
    $ResultText = [System.IO.File]::ReadAllText($OutFile, [System.Text.Encoding]::UTF8)
}
else {
    $StatusValue = "error"
    $LogText = ""
    if ((Test-Path $LogFile) -and ((Get-Item $LogFile).Length -gt 0)) {
        $LogText = [System.IO.File]::ReadAllText($LogFile, [System.Text.Encoding]::UTF8)
    }
    $ErrText = ""
    if ((Test-Path $ErrFile) -and ((Get-Item $ErrFile).Length -gt 0)) {
        $ErrText = [System.IO.File]::ReadAllText($ErrFile, [System.Text.Encoding]::UTF8)
    }

    if ($LogText -match 'not logged into Antigravity' -or $ErrText -match 'not logged into Antigravity') {
        $ResultText = "agy ist nicht bei Antigravity eingeloggt (Token abgelaufen oder fehlt). Bitte 'agy' interaktiv im Terminal starten, einloggen, danach erneut versuchen."
    }
    elseif ($TimedOut) {
        $ResultText = "agy hat nach $([math]::Round($HardTimeoutMs / 1000))s nicht reagiert und wurde hart beendet (haengender Prozess). Log: $LogFile"
    }
    elseif ($LogText.Length -gt 0) {
        $ResultText = "Keine Modellantwort auf stdout (RC=$RC). Log-Auszug: $LogText"
    }
    else {
        $ResultText = "Keine Ausgabe erhalten (weder stdout noch Log enthielten Daten, RC=$RC)."
    }
}

$ExitCodeValue = if ($StatusValue -eq "ok") { 0 } else { 1 }

[PSCustomObject]@{ task_id = $TaskId; status = $StatusValue; result = $ResultText; raw_file = $OutFile; log_file = $LogFile } | ConvertTo-Json -Compress
exit $ExitCodeValue