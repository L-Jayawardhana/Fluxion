# ──────────────────────────────────────────────────────────────────────
# Run Fluxion Selenium Smoke Tests (Java / JUnit 5 / Maven) — PowerShell
# Prerequisites: Backend + Frontend must be running
# ──────────────────────────────────────────────────────────────────────
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
$SmokeDir  = Join-Path $RepoRoot "qa/selenium-smoke"

# Defaults (override with env vars)
if (-not $env:SELENIUM_BASE_URL)    { $env:SELENIUM_BASE_URL    = "http://localhost:5173" }
if (-not $env:SELENIUM_API_BASE_URL){ $env:SELENIUM_API_BASE_URL= "http://localhost:5226/api" }
if (-not $env:SELENIUM_HEADLESS)    { $env:SELENIUM_HEADLESS    = "true" }

Write-Host "🌐 Running Selenium Smoke Tests (Java)..." -ForegroundColor Cyan
Write-Host "   Frontend: $env:SELENIUM_BASE_URL"
Write-Host "   Backend:  $env:SELENIUM_API_BASE_URL"
Write-Host "   Headless: $env:SELENIUM_HEADLESS"

mvn test `
  "-Dselenium.baseUrl=$env:SELENIUM_BASE_URL" `
  "-Dselenium.apiBaseUrl=$env:SELENIUM_API_BASE_URL" `
  "-Dselenium.headless=$env:SELENIUM_HEADLESS" `
  "-Dselenium.screenshotDir=target/screenshots" `
  --batch-mode `
  --file $SmokeDir/pom.xml `
  @args

Write-Host "✅ Smoke tests complete." -ForegroundColor Green
Write-Host "   Reports:     tests/selenium-smoke/target/surefire-reports/"
Write-Host "   Screenshots: tests/selenium-smoke/target/screenshots/"
