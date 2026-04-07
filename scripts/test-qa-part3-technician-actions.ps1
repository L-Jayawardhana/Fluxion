# ──────────────────────────────────────────────────────────────────────
# Part 3 — Technician Actions (Steps 8–11)
# Prerequisites: Backend + Frontend running, tickets assigned to tech
# ──────────────────────────────────────────────────────────────────────
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
$TestProj  = Join-Path $RepoRoot "tests/Fluxion.SeleniumTests"

# ── Technician credentials ───────────────────────────────────────────
if (-not $env:SELENIUM_TECHNICIAN_EMAIL)    { $env:SELENIUM_TECHNICIAN_EMAIL    = "it23746664@my.sliit.lk" }
if (-not $env:SELENIUM_TECHNICIAN_PASSWORD) { $env:SELENIUM_TECHNICIAN_PASSWORD = "gunarathna2003" }
if (-not $env:SELENIUM_HEADLESS)            { $env:SELENIUM_HEADLESS            = "false" }

Write-Host "================================================================" -ForegroundColor Yellow
Write-Host " Part 3 - Technician Actions (Steps 8-11)"                        -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host "  Technician: $env:SELENIUM_TECHNICIAN_EMAIL"
Write-Host "  Headless:   $env:SELENIUM_HEADLESS"
Write-Host "----------------------------------------------------------------"
Write-Host "  8.  Update Ticket Status -> in_progress"
Write-Host "  9.  Log Repair (cost: $175.50)"
Write-Host "  10. Add Comment"
Write-Host "  11. Update Asset Condition"
Write-Host "----------------------------------------------------------------"

Set-Location $RepoRoot

dotnet test $TestProj --filter "FullyQualifiedName~Part3_TechnicianActionTests" @args

Write-Host "----------------------------------------------------------------"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Part 3 completed SUCCESSFULLY." -ForegroundColor Green
} else {
    Write-Host "Part 3 FAILED." -ForegroundColor Red
}
Write-Host "  Screenshots: tests/selenium_tests/screenshots/part3_technician_actions/"
