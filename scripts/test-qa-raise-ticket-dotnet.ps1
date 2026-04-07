# ──────────────────────────────────────────────────────────────────────
# Run Fluxion QA Test: Raise Ticket (C# / Selenium / xUnit) — PowerShell
# Prerequisites: Backend + Frontend must be running
# ──────────────────────────────────────────────────────────────────────
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
$TestProject = Join-Path $RepoRoot "tests/Fluxion.SeleniumTests/Fluxion.SeleniumTests.csproj"

# User credentials (override via env vars if needed)
if (-not $env:SELENIUM_USER_EMAIL)    { $env:SELENIUM_USER_EMAIL    = "sasminakaveen@gmail.com" }
if (-not $env:SELENIUM_USER_PASSWORD) { $env:SELENIUM_USER_PASSWORD = "sasmina2003" }

# Frontend target
if (-not $env:SELENIUM_BASE_URL)      { $env:SELENIUM_BASE_URL      = "http://localhost:5173" }

# For local debugging, run headed by default
if (-not $env:SELENIUM_HEADLESS)      { $env:SELENIUM_HEADLESS      = "false" }

# Screenshot output directory
if (-not $env:SELENIUM_SCREENSHOT_DIR) {
    $env:SELENIUM_SCREENSHOT_DIR = Join-Path $RepoRoot "tests/selenium_tests/screenshots_csharp"
}

Write-Host "🌐 Running QA Automated Test: Raise Ticket (C# Selenium)..." -ForegroundColor Cyan
Write-Host "   Testing User: $env:SELENIUM_USER_EMAIL"
Write-Host "   Base URL:     $env:SELENIUM_BASE_URL"
Write-Host "   Headless:     $env:SELENIUM_HEADLESS"
Write-Host "   Screenshots:  $env:SELENIUM_SCREENSHOT_DIR"
Write-Host "--------------------------------------------------------"

Set-Location $RepoRoot

dotnet test $TestProject `
  --filter "FullyQualifiedName~RaiseTicketSeleniumTests" `
  --configuration Release `
  --logger "console;verbosity=normal" `
  @args

Write-Host "--------------------------------------------------------"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ C# Selenium Raise Ticket test completed successfully." -ForegroundColor Green
} else {
    Write-Host "❌ C# Selenium Raise Ticket test FAILED." -ForegroundColor Red
}
