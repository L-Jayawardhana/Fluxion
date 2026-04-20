# ──────────────────────────────────────────────────────────────────────
# Run Fluxion .NET Unit Tests (PowerShell)
# ──────────────────────────────────────────────────────────────────────
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir

Write-Host "🧪 Running Unit Tests..." -ForegroundColor Cyan
dotnet test (Join-Path $RepoRoot "tests\Fluxion.UnitTests\Fluxion.UnitTests.csproj") `
  --configuration Release `
  --logger "console;verbosity=normal" `
  --collect:"XPlat Code Coverage" `
  --results-directory (Join-Path $RepoRoot "TestResults\UnitTests") `
  @args

Write-Host "✅ Unit tests complete." -ForegroundColor Green
