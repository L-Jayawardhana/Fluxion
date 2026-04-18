# Scripts — DevOps & QA Automation

This directory contains all **automation scripts** for the Fluxion project: test runners, report generators, and deployment utilities. Every script is provided in both **Bash** (`.sh` for Linux/macOS/CI) and **PowerShell** (`.ps1` for Windows) where applicable.

---

## Directory Structure

```
scripts/
├── test-unit.sh / .ps1                # Run backend unit tests
├── test-integration.sh / .ps1         # Run backend integration tests
├── test-e2e.ps1                       # Run Selenium E2E smoke tests
├── test-perf.sh / .ps1                # Run JMeter performance tests
├── run-all-tests.sh                   # Orchestrate all test suites in sequence
├── test-utils.sh                      # Shared helper functions (parsing, reporting)
├── generate-dashboard.sh              # Generate a Markdown test results dashboard
├── generate-full-qa-report.sh         # Generate a full HTML QA report with screenshots
└── setup-vm-ssl.sh                    # One-time Azure VM SSL/Nginx setup
```

---

## Quick Reference

| Task | Bash | PowerShell |
|------|------|------------|
| Run unit tests | `./scripts/test-unit.sh` | `.\scripts\test-unit.ps1` |
| Run integration tests | `./scripts/test-integration.sh` | `.\scripts\test-integration.ps1` |
| Run Selenium E2E tests | — | `.\scripts\test-e2e.ps1` |
| Run JMeter smoke test | `./scripts/test-perf.sh smoke` | `.\scripts\test-perf.ps1 smoke` |
| Run JMeter load test | `./scripts/test-perf.sh load` | `.\scripts\test-perf.ps1 load` |
| Run **all** tests | `./scripts/run-all-tests.sh` | — |
| Generate test dashboard | `./scripts/generate-dashboard.sh` | — |
| Generate full QA report | `./scripts/generate-full-qa-report.sh` | — |
| Setup VM SSL | `sudo bash scripts/setup-vm-ssl.sh <domain> <email>` | — |

---

## Test Runner Scripts

### `test-unit.sh` / `test-unit.ps1`

Runs the **123 backend xUnit unit tests** from `BackEnd/tests/Fluxion.UnitTests/`.

- **Dependencies:** .NET SDK 8.0+ only (no external DB or services needed)
- **Database:** EF Core InMemory — completely self-contained
- **Output:**
  - Console results with pass/fail counts
  - `.trx` report file in `TestResults/Unit/`
  - Code coverage (Cobertura XML) via `coverlet.collector`
  - JSON + Markdown summary files (via `test-utils.sh`)

```bash
# Run with default settings
./scripts/test-unit.sh

# Pass extra flags to dotnet test
./scripts/test-unit.sh --filter "FullyQualifiedName~Authentication"
```

---

### `test-integration.sh` / `test-integration.ps1`

Runs the **35 backend integration tests** from `BackEnd/tests/Fluxion.IntegrationTests/`.

- **Dependencies:** .NET SDK 8.0+ only
- **Database:** InMemory (swapped in by `FluxionWebApplicationFactory`)
- **How it works:** Spins up the full ASP.NET Core pipeline using `WebApplicationFactory<Program>`, sends real HTTP requests through the middleware stack, and asserts on response status codes and JSON bodies
- **Output:** Same as unit tests (`.trx`, coverage, JSON/Markdown summaries)

```bash
./scripts/test-integration.sh
```

---

### `test-e2e.ps1`

Runs **Selenium smoke tests** for the frontend using Java + JUnit 5 + Maven.

- **Prerequisites:**
  - Backend must be running (`dotnet run` on port 5226)
  - Frontend must be running (`npm run dev` on port 5173)
  - Java 21+, Maven 3.9+, Chrome (latest stable)
- **Configuration:** Controlled via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SELENIUM_BASE_URL` | `http://localhost:5173` | Frontend URL |
| `SELENIUM_API_BASE_URL` | `http://localhost:5226/api` | Backend API URL |
| `SELENIUM_HEADLESS` | `true` | Run Chrome headless |

- **Output:**
  - Surefire XML reports in `qa/selenium-smoke/target/surefire-reports/`
  - Failure screenshots in `qa/selenium-smoke/target/screenshots/`

```powershell
# Headless (default)
.\scripts\test-e2e.ps1

# Visible browser for debugging
$env:SELENIUM_HEADLESS = "false"
.\scripts\test-e2e.ps1
```

---

### `test-perf.sh` / `test-perf.ps1`

Runs **Apache JMeter performance tests** from `qa/jmeter/`.

- **Prerequisites:** JMeter 5.6+ on `PATH`, backend running
- **Plans:**

| Plan | File | What it does |
|------|------|--------------|
| `smoke` | `qa/jmeter/auth_smoke.jmx` | 1 user, 1 loop — quick API sanity check |
| `load` | `qa/jmeter/auth_load.jmx` | 50 users, 30s ramp-up, 120s sustained load |

- **Output:**
  - `.jtl` result files in `qa/jmeter/results/`
  - HTML dashboard in `qa/jmeter/results/<plan>_report_<timestamp>/index.html`
  - JSON + Markdown summaries (success rate, request counts)

```bash
# Quick smoke test
./scripts/test-perf.sh smoke

# Full load test
./scripts/test-perf.sh load

# Custom parameters
./scripts/test-perf.sh load -JTHREADS=100 -JRAMP_UP=60 -JDURATION=300
```

---

## Orchestration & Reporting Scripts

### `run-all-tests.sh`

**Master orchestration script** — runs unit, integration, and smoke tests in sequence, then generates a consolidated dashboard.

- Tracks pass/fail status for each suite independently
- Exits with code `1` if any suite fails
- Optionally includes performance tests with `--include-perf`

```bash
# Run all tests (unit + integration + smoke)
./scripts/run-all-tests.sh

# Include performance tests
./scripts/run-all-tests.sh --include-perf
```

---

### `test-utils.sh`

**Shared utility library** sourced by all test runner scripts. Not run directly.

| Function | Purpose |
|----------|---------|
| `generate_test_result()` | Writes structured JSON + Markdown summary files for a test run |
| `parse_dotnet_results()` | Extracts pass/fail/skip counts from `dotnet test` console output |
| `parse_maven_results()` | Extracts pass/fail counts from Maven/Surefire console output |
| `ensure_bc()` | Checks that `bc` is installed (used for percentage calculations) |

Output files are written to `TestResults/<TestType>/test-result.json` and `test-summary.md`.

---

### `generate-dashboard.sh`

Reads the JSON result files generated by each test runner and produces a **consolidated Markdown dashboard** at `TestResults/test-dashboard.md`.

- **Requires:** `jq` for JSON parsing
- **Reads from:** `TestResults/Unit/`, `TestResults/Integration/`, `TestResults/Smoke/`, `TestResults/Performance/`
- Shows status emoji (✅❌⚠️), timestamps, duration, pass rates, and links to detailed reports

```bash
./scripts/generate-dashboard.sh
# Output: TestResults/test-dashboard.md
```

---

### `generate-full-qa-report.sh`

**Comprehensive HTML QA report generator** with embedded Selenium screenshots. This is the most powerful script — it:

1. **Starts services** — Launches backend and frontend if not already running
2. **Captures screenshots** — Uses Python + Selenium to screenshot login, register, dashboard, 404, and Swagger pages
3. **Runs all tests** — Unit, integration, and smoke test suites
4. **Parses results** — Extracts pass/fail statistics from all test outputs
5. **Generates HTML report** — Professional, styled HTML report with:
   - Executive summary with stat cards and progress bars
   - Tabbed detailed test results (unit, smoke, API, integration)
   - Screenshot gallery with lightbox modal
   - Defect tracking table with severity ratings
   - Risk assessment matrix

- **Prerequisites:** Python 3.10+, Selenium, Firefox (geckodriver), .NET SDK, Node.js, Maven
- **Output:** `QAReport_<timestamp>/` directory containing:
  - `QA_Report_<date>.html` — Main report
  - `Screenshots/` — Organized by category (Frontend, Swagger, etc.)
  - `TestOutputs/` — Raw test console output
  - `screenshot_results.json` — Screenshot capture results

```bash
./scripts/generate-full-qa-report.sh
# Open: QAReport_<timestamp>/QA_Report_<date>.html
```

---

## Deployment Scripts

### `setup-vm-ssl.sh`

**One-time infrastructure setup** for the Azure VM deployment. Called during initial server provisioning.

- Installs Nginx and Certbot
- Writes Nginx reverse proxy config from `nginx/api.conf` template
- Obtains a free Let's Encrypt SSL certificate
- Enables HTTPS redirect

```bash
# Run on the Azure VM (requires root)
sudo bash scripts/setup-vm-ssl.sh api.yourdomain.com admin@yourdomain.com
```

After running, the script prints next steps:
1. Update `VITE_API_URL` in Vercel environment settings
2. Update `ALLOWED_ORIGIN_0/1` in GitHub Secrets
3. Add the domain to Google Cloud Console OAuth origins

---

## CI/CD Integration

These scripts are used by the GitHub Actions workflow (`.github/workflows/cicd.yml`):

```yaml
# The CI pipeline references test projects directly rather than using scripts,
# but the paths match. The scripts are primarily for local developer use.
- name: Run unit tests
  run: dotnet test ../tests/Fluxion.UnitTests/Fluxion.UnitTests.csproj
```

The `setup-vm-ssl.sh` script is copied to the VM via the `deploy` job and used during initial provisioning.

---

## Adding a New Script

When adding a new script:

1. **Provide both `.sh` and `.ps1` versions** when possible
2. **Source `test-utils.sh`** if the script generates test results
3. **Use `$REPO_ROOT`** for all paths (derived from script location, not hardcoded)
4. **Follow the naming convention:** `test-<type>.sh` for test runners, `generate-<what>.sh` for report generators
5. **Add the script** to this README and to `TEST_PLAN.md`

---

## Related

| Resource | Path |
|----------|------|
| Backend tests | [`BackEnd/tests/`](../BackEnd/tests/) |
| QA shared layer | [`qa/`](../qa/) |
| Full test plan | [`TEST_PLAN.md`](../TEST_PLAN.md) |
| CI/CD workflow | [`.github/workflows/cicd.yml`](../.github/workflows/cicd.yml) |
