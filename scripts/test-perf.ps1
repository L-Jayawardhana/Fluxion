# ──────────────────────────────────────────────────────────────────────
# Run JMeter Performance Tests (PowerShell)
# Requires: Apache JMeter 5.x+ installed and on PATH, Backend running
# Usage:
#   .\scripts\test-perf.ps1 smoke
#   .\scripts\test-perf.ps1 load -JTHREADS=100 -JDURATION=300
# ──────────────────────────────────────────────────────────────────────
$ErrorActionPreference = "Stop"
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot   = Split-Path -Parent $ScriptDir
$JmeterDir  = Join-Path $RepoRoot "qa\jmeter"
$ResultsDir = Join-Path $JmeterDir "results"

$Plan = if ($args.Count -gt 0) { $args[0] } else { "smoke" }
$ExtraArgs = if ($args.Count -gt 1) { $args[1..($args.Count - 1)] } else { @() }

switch ($Plan) {
    "smoke" { $Jmx = Join-Path $JmeterDir "auth_smoke.jmx" }
    "load"  { $Jmx = Join-Path $JmeterDir "auth_load.jmx" }
    default {
        Write-Host "Usage: .\test-perf.ps1 {smoke|load} [jmeter-flags]"
        exit 1
    }
}

$Timestamp  = Get-Date -Format "yyyyMMdd_HHmmss"
$ResultFile = Join-Path $ResultsDir "${Plan}_${Timestamp}.jtl"
$ReportDir  = Join-Path $ResultsDir "${Plan}_report_${Timestamp}"

New-Item -ItemType Directory -Force -Path $ResultsDir | Out-Null

Write-Host "⚡ Running JMeter $Plan test..." -ForegroundColor Cyan
Write-Host "   Plan:    $Jmx"
Write-Host "   Results: $ResultFile"
Write-Host "   Report:  $ReportDir"

& jmeter -n -t $Jmx -l $ResultFile -e -o $ReportDir @ExtraArgs

Write-Host "`n✅ JMeter $Plan test complete." -ForegroundColor Green
Write-Host "   Open $ReportDir\index.html for the HTML dashboard."
