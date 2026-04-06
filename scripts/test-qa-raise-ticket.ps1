# ──────────────────────────────────────────────────────────────────────
# Run Fluxion QA Test: Raise Ticket (Python / Selenium) — PowerShell
# Prerequisites: Backend + Frontend must be running
# ──────────────────────────────────────────────────────────────────────
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
$TestFile  = Join-Path $RepoRoot "tests/selenium_tests/raise_ticket_selenium.py"

# User Credentials (Change these if your local user has different credentials or no assets!)
if (-not $env:SELENIUM_USER_EMAIL)    { $env:SELENIUM_USER_EMAIL    = "sasminakaveen@gmail.com" }
if (-not $env:SELENIUM_USER_PASSWORD) { $env:SELENIUM_USER_PASSWORD = "sasmina2003" }

# Run normally without "headless" mode so you can see Chrome driving itself!
# Change to "true" if you want it to run silently in the background
if (-not $env:SELENIUM_HEADLESS)      { $env:SELENIUM_HEADLESS      = "false" }

Write-Host "🌐 Running QA Automated Test: Raise Maintenance Ticket..." -ForegroundColor Cyan
Write-Host "   Testing User: $env:SELENIUM_USER_EMAIL"
Write-Host "   Headless Mode: $env:SELENIUM_HEADLESS"
Write-Host "--------------------------------------------------------"

# Ensure Python is tracking the right path
Set-Location $RepoRoot

# Execute the test
python "$TestFile"

Write-Host "--------------------------------------------------------"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Raise Ticket QA test completed successfully." -ForegroundColor Green
} else {
    Write-Host "❌ Raise Ticket QA test FAILED." -ForegroundColor Red
}

Write-Host "   Screenshots saved to: tests/selenium_tests/screenshots/"
