# ──────────────────────────────────────────────────────────────────────
# Part 4 — Owner Review & Reports (Steps 12–14)
# Prerequisites: Backend + Frontend running, repairs logged (Part 3)
# ──────────────────────────────────────────────────────────────────────
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
$TestProj  = Join-Path $RepoRoot "tests/Fluxion.SeleniumTests"

# ── Owner credentials ────────────────────────────────────────────────
if (-not $env:SELENIUM_OWNER_EMAIL)    { $env:SELENIUM_OWNER_EMAIL    = "gunarathnakaveen3@gmail.com" }
if (-not $env:SELENIUM_OWNER_PASSWORD) { $env:SELENIUM_OWNER_PASSWORD = "Kaveen2003" }
if (-not $env:SELENIUM_HEADLESS)       { $env:SELENIUM_HEADLESS       = "false" }

Write-Host "================================================================" -ForegroundColor Blue
Write-Host " Part 4 - Owner Review and Reports (Steps 12-14)"                 -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue
Write-Host "  Owner:    $env:SELENIUM_OWNER_EMAIL"
Write-Host "  Headless: $env:SELENIUM_HEADLESS"
Write-Host "----------------------------------------------------------------"
Write-Host "  12. View Asset Maintenance Log Page"
Write-Host "  13. View/Toggle Owner Comments (internal notes)"
Write-Host "  14. View Maintenance Cost Report"
Write-Host "----------------------------------------------------------------"

Set-Location $RepoRoot

dotnet test $TestProj --filter "FullyQualifiedName~Part4_OwnerReportTests" @args

Write-Host "----------------------------------------------------------------"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Part 4 completed SUCCESSFULLY." -ForegroundColor Green
} else {
    Write-Host "Part 4 FAILED." -ForegroundColor Red
}
Write-Host "  Screenshots: tests/selenium_tests/screenshots/part4_owner_reports/"
