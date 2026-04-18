# QA — Shared Quality Assurance Layer

This directory contains **cross-cutting QA tools** shared across the entire Fluxion monorepo (Backend, User Frontend, Admin Dashboard).

> **Convention:** App-specific tests live inside each service (`BackEnd/tests/`, `FrontEnd/Fluxion/tests/`, `FluxionAdminDash/tests/`).  
> This `qa/` folder holds only **shared configuration, tooling, and reports**.

---

## Directory Structure

```
qa/
├── conftest.py          # Shared Selenium WebDriver fixtures (Python / pytest)
├── jmeter/              # Apache JMeter performance test plans
│   ├── auth_load.jmx    # 50-thread sustained load test (2 min)
│   └── auth_smoke.jmx   # Single-user auth flow smoke test
├── postman/             # Postman / Newman API collections
├── swagger/             # Exported Swagger / OpenAPI specs
└── reports/             # Auto-generated test reports & dashboards
```

---

## 1. Shared Selenium Configuration (`conftest.py`)

Provides **session-scoped** browser fixtures for both frontends so E2E tests share identical WebDriver setup.

| Fixture | Target | Default URL |
|---------|--------|-------------|
| `user_driver` | User Frontend | `http://localhost:5173` |
| `admin_driver` | Admin Dashboard | `http://localhost:5174` |

### Prerequisites

```bash
pip install selenium pytest webdriver-manager
```

### Usage

Tests in `FrontEnd/Fluxion/tests/e2e/` and `FluxionAdminDash/tests/e2e/` import these fixtures automatically:

```bash
# Run user frontend E2E tests
pytest FrontEnd/Fluxion/tests/e2e/ --rootdir=qa/

# Run admin dashboard E2E tests
pytest FluxionAdminDash/tests/e2e/ --rootdir=qa/
```

### Configuration

The `conftest.py` runs Chrome in **headless mode** by default. To launch a visible browser for debugging:

```python
# Remove or comment out in conftest.py:
options.add_argument("--headless=new")
```

---

## 2. JMeter Performance Tests (`jmeter/`)

Two pre-built test plans for the backend API:

| Plan | File | Threads | Duration | Purpose |
|------|------|---------|----------|---------|
| **Smoke** | `auth_smoke.jmx` | 1 | 1 loop | Quick sanity — verify auth endpoints respond |
| **Load** | `auth_load.jmx` | 50 | 120s | Sustained load — find performance regressions |

### Prerequisites

- [Apache JMeter 5.6+](https://jmeter.apache.org/download_jmeter.cgi) on `PATH`
- Backend API running at `http://localhost:5226`

### Running

```bash
# Quick smoke test
./scripts/test-perf.sh smoke

# Full load test (PowerShell)
.\scripts\test-perf.ps1 load

# Custom parameters
./scripts/test-perf.sh load -JTHREADS=100 -JRAMP_UP=60 -JDURATION=300

# GUI mode (for editing plans)
jmeter -t qa/jmeter/auth_smoke.jmx
```

### Recommended Load Scenarios

| Scenario | Threads | Ramp-up | Duration |
|----------|---------|---------|----------|
| Smoke | 1 | 0s | 1 loop |
| Light Load | 10 | 10s | 60s |
| Normal Load | 50 | 30s | 120s |
| Stress | 200 | 60s | 300s |

Results and HTML dashboards are saved to `qa/jmeter/results/`.

---

## 3. Postman Collections (`postman/`)

Place exported Postman collections (`.json`) here for API contract testing. These can be run headlessly via [Newman](https://github.com/postmanlabs/newman):

```bash
npm install -g newman
newman run qa/postman/Fluxion_API.postman_collection.json \
  --environment qa/postman/local.postman_environment.json
```

---

## 4. Swagger / OpenAPI Specs (`swagger/`)

Store exported `swagger.json` or `openapi.yaml` files for API documentation and contract versioning.

When the backend is running locally, the live spec is available at:
- **Swagger UI:** `http://localhost:5226/swagger`
- **JSON spec:** `http://localhost:5226/swagger/v1/swagger.json`

Export and commit snapshots here for CI diff checks or client SDK generation.

---

## 5. Test Reports (`reports/`)

Auto-generated reports land here when running the full test suite:

```bash
# Generate comprehensive QA report
./scripts/generate-full-qa-report.sh

# View the dashboard
open TestResults/test-dashboard.md
```

> **Note:** This directory is `.gitignore`'d for generated output. Only templates or configuration files should be committed.

---

## Related Directories

| Directory | Contents |
|-----------|----------|
| [`BackEnd/tests/`](../BackEnd/tests/) | .NET xUnit unit + integration tests |
| [`FrontEnd/Fluxion/tests/e2e/`](../FrontEnd/Fluxion/tests/e2e/) | User frontend Selenium E2E tests |
| [`FluxionAdminDash/tests/e2e/`](../FluxionAdminDash/tests/e2e/) | Admin dashboard Selenium E2E tests |
| [`scripts/`](../scripts/) | Test runner scripts (PS1 + bash) |
| [`TEST_PLAN.md`](../TEST_PLAN.md) | Full QA gate checklist and test plan |
