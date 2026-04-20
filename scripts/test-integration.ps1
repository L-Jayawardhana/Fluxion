# ──────────────────────────────────────────────────────────────────────
# Run Fluxion .NET Integration Tests (PowerShell)
# ──────────────────────────────────────────────────────────────────────
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir

Write-Host "🔗 Running Integration Tests..." -ForegroundColor Cyan
dotnet test (Join-Path $RepoRoot "tests\Fluxion.IntegrationTests\Fluxion.IntegrationTests.csproj") `
  --configuration Release `
  --logger "console;verbosity=normal" `
  --collect:"XPlat Code Coverage" `
  --results-directory (Join-Path $RepoRoot "TestResults\IntegrationTests") `
  @args

Write-Host "✅ Integration tests complete." -ForegroundColor Green
