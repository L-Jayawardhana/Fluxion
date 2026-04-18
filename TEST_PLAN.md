# Fluxion QA Test Plan

> **Branch strategy:** We develop on `dev` and deploy from `main`.  
> Every PR from `dev → main` must pass the QA gate below.

---

## Table of Contents

1. [QA Gate Checklist](#qa-gate-checklist)
2. [Test Suites Overview](#test-suites-overview)
3. [Running Tests Locally](#running-tests-locally)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Environment Variables](#environment-variables)
6. [Discovered Endpoints](#discovered-endpoints)
7. [Google Sign-In Testing](#google-sign-in-testing)
8. [Assumptions & Notes](#assumptions--notes)

---

## QA Gate Checklist

Before merging `dev → main`, verify:

- [ ] **Unit Tests** pass (`dotnet test` — Fluxion.UnitTests)
- [ ] **Integration Tests** pass (`dotnet test` — Fluxion.IntegrationTests)
- [ ] **Selenium Smoke Tests** pass (`mvn test` — Java/JUnit 5, tagged `smoke`)
- [ ] **JMeter smoke** completes with 0% error rate
- [ ] **Code coverage** ≥ 70% on Application + Infrastructure layers.
- [ ] **Manual smoke test** for Google Sign-In (see section below)
- [ ] No new security warnings in `dotnet list package --vulnerable`

---

## Test Suites Overview

| Suite | Framework | Location | What it tests |
|-------|-----------|----------|---------------|
| **Unit Tests** | xUnit + Moq + FluentAssertions | `BackEnd/tests/Fluxion.UnitTests/` | Handlers, validators, JWT, password hashing, verification codes |
| **Integration Tests** | xUnit + WebApplicationFactory | `BackEnd/tests/Fluxion.IntegrationTests/` | Full HTTP request/response through the API pipeline (in-memory DB) |
| **Selenium Smoke** | Java + JUnit 5 + Selenium 4 | `qa/selenium-smoke/` | Login page load, register page load, wrong-password error, empty-form guard, auth-guard redirect |
| **JMeter Smoke** | Apache JMeter 5.x | `qa/jmeter/auth_smoke.jmx` | Single-user auth flow verification |
| **JMeter Load** | Apache JMeter 5.x | `qa/jmeter/auth_load.jmx` | 50 concurrent users, 2-minute sustained load |

---

## Running Tests Locally

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| .NET SDK | 8.0+ | Build & run all .NET test projects |
| Java (JDK) | 21+ | Build & run Selenium smoke tests |
| Maven | 3.9+ | Selenium smoke test runner |
| Node.js | 20+ | Frontend dev server (for smoke tests) |
| Chrome | Latest stable | Selenium WebDriver (auto-managed) |
| Apache JMeter | 5.6+ | Performance tests |

### 1. Unit Tests

```bash
# Bash
./scripts/test-unit.sh

# PowerShell
.\scripts\test-unit.ps1

# Or directly:
dotnet test BackEnd/tests/Fluxion.UnitTests/Fluxion.UnitTests.csproj --configuration Release
```

No external dependencies needed — uses in-memory database and mocks.

### 2. Integration Tests

```bash
# Bash
./scripts/test-integration.sh

# PowerShell
.\scripts\test-integration.ps1

# Or directly:
dotnet test BackEnd/tests/Fluxion.IntegrationTests/Fluxion.IntegrationTests.csproj --configuration Release
```

Uses `WebApplicationFactory` with an in-memory database — no Docker or MySQL required.

### 3. Selenium Smoke Tests (Java)

**Start the backend and frontend first:**

```bash
# Terminal 1 — Backend
cd BackEnd/src/Fluxion.API
dotnet run

# Terminal 2 — Frontend
cd FrontEnd/Fluxion
npm install
npm run dev
```

**Then run the smoke tests:**

```bash
# Bash
./scripts/test-e2e.sh

# PowerShell
.\scripts\test-e2e.ps1

# Or directly with Maven:
cd tests/selenium-smoke
mvn test

# With a visible browser (for debugging):
SELENIUM_HEADLESS=false ./scripts/test-e2e.sh
```

Five fast smoke tests run (tagged `smoke`):

| ID | What is checked |
|----|----------------|
| SMOKE-01 | Login page loads — email field + submit button visible |
| SMOKE-02 | Register page loads — Step-1 form visible |
| SMOKE-03 | Wrong password shows error banner, stays on `/login` |
| SMOKE-04 | Empty form submit stays on `/login` (HTML5 validation) |
| SMOKE-05 | Unauthenticated `/dashboard` access redirects to `/login` |

Screenshots on failure are saved to `qa/selenium-smoke/target/screenshots/`.  
Surefire XML reports are at `qa/selenium-smoke/target/surefire-reports/`.

### 4. JMeter Performance Tests

**Backend must be running with a real (or test) database.**

```bash
# Smoke test (1 user, 1 iteration)
./scripts/test-perf.sh smoke

# Load test (50 users, 30s ramp-up, 120s duration)
./scripts/test-perf.sh load

# Custom load parameters
./scripts/test-perf.sh load -JTHREADS=100 -JRAMP_UP=60 -JDURATION=300

# GUI mode for editing plans
jmeter -t qa/jmeter/auth_smoke.jmx
```

**JMeter CLI mode output:**
```bash
jmeter -n -t qa/jmeter/auth_load.jmx -l results.jtl -e -o report
# Open report/index.html for the HTML dashboard
```

**Recommended load parameters:**

| Scenario | Threads | Ramp-up | Duration | Notes |
|----------|---------|---------|----------|-------|
| Smoke | 1 | 0s | 1 loop | Quick sanity check |
| Light Load | 10 | 10s | 60s | Baseline performance |
| Normal Load | 50 | 30s | 120s | Expected production load |
| Stress | 200 | 60s | 300s | Find breaking point |

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/qa.yml`) runs:

| Job | Trigger | Duration |
|-----|---------|----------|
| **Unit Tests** | Every push/PR to `dev` and `main` | ~1 min |
| **Integration Tests** | Every push/PR to `dev` and `main` | ~2 min |
| **Selenium Smoke** | Every push/PR (after unit + integration), nightly, manual dispatch | ~3 min |

**Artifacts uploaded:**
- Unit/integration `.trx` result files
- Code coverage reports
- Selenium smoke JUnit XML reports (`surefire-reports/`)
- Selenium failure screenshots (`target/screenshots/`)

---

## Environment Variables

### Backend (`appsettings.json` / env vars)

| Variable | Description | Test Default |
|----------|-------------|--------------|
| `ConnectionStrings__DefaultConnection` | MySQL connection string | In-memory (tests) |
| `JwtSettings__SecretKey` | HMAC-SHA256 signing key (≥32 chars) | Auto-set in test factory |
| `JwtSettings__Issuer` | JWT issuer claim | `FluxionTest` |
| `JwtSettings__Audience` | JWT audience claim | `FluxionTestUsers` |
| `JwtSettings__ExpiryMinutes` | Token lifetime | `5` (tests), `60` (prod) |
| `SmtpSettings__Host` | SMTP server | No-op in tests |
| `GoogleAuth__ClientId` | Google OAuth client ID | Not needed for unit/integration tests |

### Selenium Smoke Tests (Maven system properties / env vars)

| System Property | Env Var | Description | Default |
|-----------------|---------|-------------|---------|
| `selenium.baseUrl` | `SELENIUM_BASE_URL` | Frontend URL | `http://localhost:5173` |
| `selenium.apiBaseUrl` | `SELENIUM_API_BASE_URL` | Backend API URL | `http://localhost:5226/api` |
| `selenium.headless` | `SELENIUM_HEADLESS` | Run Chrome headless | `true` |
| `selenium.explicitWait` | `SELENIUM_EXPLICIT_WAIT` | WebDriverWait timeout (s) | `10` |
| `selenium.screenshotDir` | `SELENIUM_SCREENSHOT_DIR` | Screenshot output path | `target/screenshots` |

### JMeter (passed as `-J` flags)

| Property | Description | Default |
|----------|-------------|---------|
| `BASE_HOST` | API hostname | `localhost` |
| `BASE_PORT` | API port | `5226` |
| `BASE_PROTOCOL` | `http` or `https` | `http` |
| `THREADS` | Concurrent users (load test) | `50` |
| `RAMP_UP` | Ramp-up period in seconds | `30` |
| `DURATION` | Test duration in seconds | `120` |

---

## Discovered Endpoints

These endpoints were discovered from the actual source code (not invented):

| Method | Path | Auth | Controller |
|--------|------|------|------------|
| `POST` | `/api/auth/login` | No | `AuthController` |
| `POST` | `/api/auth/register` | No | `AuthController` |
| `POST` | `/api/auth/google` | No | `AuthController` |
| `POST` | `/api/auth/send-verification-code` | No | `AuthController` |
| `POST` | `/api/auth/verify-code` | No | `AuthController` |
| `POST` | `/api/auth/send-welcome-email` | No | `AuthController` |
| `GET`  | `/api/auth/test-email` | No | `AuthController` (temp) |
| `GET`  | `/api/health` | No | `HealthController` |
| `POST` | `/api/organization` | No | `OrganizationController` |
| `POST` | `/api/organization/{id}/logo` | No | `OrganizationController` |

> **Note:** No endpoints currently use the `[Authorize]` attribute. JWT authentication is
> configured at the middleware level but not enforced on specific endpoints yet.
> The frontend handles auth via localStorage token + axios interceptor (401 → redirect to login).

---

## Google Sign-In Testing

Google OAuth **cannot** be reliably automated with Selenium because Google actively blocks
automated/headless browser logins (CAPTCHA, device verification, etc.).

### Recommended approaches:

1. **Manual smoke test** (current):
   - Navigate to `/login`
   - Click "Sign in with Google"
   - Complete the Google OAuth popup
   - Verify redirect to `/dashboard` (existing user) or `/register` step 2 (new user)
   - Verify JWT token appears in `localStorage`

2. **QA-mode mock** (future improvement):
   - Add a `QA_MODE` environment variable
   - When enabled, expose a test-only `POST /api/auth/google-mock` endpoint that accepts
     a fake Google payload and returns a JWT (bypassing Google token validation)
   - Protect with an API key so it cannot be accidentally used in production

3. **Integration test coverage**:
   - The `GoogleLoginHandler` is unit-testable by mocking `GoogleJsonWebSignature.ValidateAsync`
   - This covers the core logic without needing a real Google token

---

## Assumptions & Notes

1. **No refresh token:** The app uses a single JWT (60-minute expiry). There is no refresh
   token rotation mechanism. Tests reflect this architecture.

2. **No `[Authorize]` on endpoints:** Currently, no controller endpoints enforce authorization
   via the `[Authorize]` attribute. The JWT middleware is configured but not applied to specific
   endpoints. Integration tests document this behavior — all endpoints return 200 even without
   a token.

3. **Email verification in registration:** The 4-step registration wizard requires email
   verification (6-digit code). The Selenium smoke test only validates that Step-1 renders
   correctly — it does not attempt to complete the full registration flow. For full flow
   testing, use the integration tests which bypass the UI.

4. **In-memory DB for tests:** Integration tests use `Microsoft.EntityFrameworkCore.InMemory`
   instead of MySQL. This avoids Docker dependencies but may not catch MySQL-specific issues.
   For production-parity testing, switch to `Testcontainers.MySql`.

5. **Frontend has no `data-testid` attributes.** Selenium selectors use `input[type]`,
   `input[name]`, CSS classes, and button text. These may break if the UI is redesigned.
   Consider adding `data-testid` attributes to key elements for more stable selectors.

6. **JMeter test user:** The JMeter plans register a dedicated test user during setup.
   If the user already exists (from a previous run), the setup step will return 409
   (Conflict), which is harmless — the login step will still work.
