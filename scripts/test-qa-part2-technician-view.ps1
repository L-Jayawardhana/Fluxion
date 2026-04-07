# ──────────────────────────────────────────────────────────────────────
# Part 2 — Technician Views & Filters (Steps 4–7)
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

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " Part 2 - Technician Views and Filters (Steps 4-7)"              -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Technician: $env:SELENIUM_TECHNICIAN_EMAIL"
Write-Host "  Headless:   $env:SELENIUM_HEADLESS"
Write-Host "----------------------------------------------------------------"
Write-Host "  4. View Dashboard Stats"
Write-Host "  5. View Assigned Tickets"
Write-Host "  6. Filter Tickets by Status"
Write-Host "  7. View Ticket Detail"
Write-Host "----------------------------------------------------------------"

Set-Location $RepoRoot

dotnet test $TestProj --filter "FullyQualifiedName~Part2_TechnicianViewTests" @args

Write-Host "----------------------------------------------------------------"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Part 2 completed SUCCESSFULLY." -ForegroundColor Green
} else {
    Write-Host "Part 2 FAILED." -ForegroundColor Red
}
Write-Host "  Screenshots: tests/selenium_tests/screenshots/part2_technician_view/"
