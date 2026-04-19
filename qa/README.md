# QA — Shared Quality Assurance Layer

This directory contains **cross-cutting QA tools** shared across the entire Fluxion monorepo (Backend, User Frontend, Admin Dashboard). This includes E2E browser tests and Performance load tests.

---

## Directory Structure

``` text
qa/
├── conftest.py          # Shared Selenium WebDriver setup/fixtures
├── selenium/            # E2E Browser Testing Framework
│   ├── config.py        # Central config, test users, and RBAC matrix
│   ├── pages/           # Page Object Model (POM) classes
│   └── tests/           # Selenium test suites (pytest format)
├── jmeter/              # Apache JMeter performance test plans
└── ...
```

---

## 1. Selenium E2E Tests (Python + pytest)

The project uses a Page Object Model (POM) framework to test full end-to-end user flows, with a primary focus on Role-Based Access Control (RBAC).

### Prerequisites

You need Python installed, along with Google Chrome. Install the required Python packages:

```bash
cd qa
pip install pytest selenium webdriver-manager
```

### Running the Tests

Make sure your backend (`dotnet run`) and frontend (`npm run dev`) are running first, as Selenium actually opens a browser and interacts with the live dev servers.

**Run the entire suite:**
```bash
cd qa
pytest selenium/tests/ -v
```

**Run specific test suites:**
```bash
cd qa
# 1. Public Pages (Landing, 404)
pytest selenium/tests/test_01_public_pages.py -v

# 2. Authentication (Login, Logout, Session)
pytest selenium/tests/test_02_auth.py -v

# 3. RBAC Matrix (Tests all roles against all routes)
pytest selenium/tests/test_03_rbac.py -v

# 4. Navigation & Layout (Sidebar, Responsiveness)
pytest selenium/tests/test_04_navigation.py -v
```

> **Note**: Test `test_03_rbac.py` requires seeded test user accounts defined in `selenium/config.py` in your local database. By default, Selenium runs in **headless** mode. To see the browser opening in real-time, comment out `options.add_argument("--headless=new")` inside `qa/conftest.py`.

---

## 2. Apache JMeter Performance Tests

JMeter test plans (`.jmx` files) are used to test API endpoints under concurrent user load.

### Pre-requisites

- Download and install [Apache JMeter](https://jmeter.apache.org/download_jmeter.cgi) (Requires Java).
- Ensure JMeter is added to your system `PATH` (so you can run the `jmeter` command).

### Available Test Plans

| Plan File | Purpose | Load Simulation |
|-----------|---------|-----------------|
| `asset_pagination_load.jmx` | Tests the `GET /api/Asset` endpoint | 50 concurrent users, 3 loops |
| `concurrent_ticket_update.jmx`| Tests Ticket Assignment race conditions | 20 users burst updating simultaneously |

### Running the Tests

For accurate results, JMeter must be run in **CLI (Non-GUI) Mode**. 
You will need to edit the `.jmx` files first (or pass variables via CLI) to inject a valid `AUTH_TOKEN`.

```bash
cd qa/jmeter

# 1. Run Asset Load Test
jmeter -n -t asset_pagination_load.jmx -l asset_results.jtl -e -o ./asset_report

# 2. Run Ticket Race Condition Test
jmeter -n -t concurrent_ticket_update.jmx -l ticket_results.jtl -e -o ./ticket_report
```

* ` -n ` : Run in non-GUI mode
* ` -t ` : Specifies the test plan to run
* ` -l ` : Saves the raw results to a `.jtl` file
* ` -e -o ` : Generates a readable HTML report folder at the given path. You can open `index.html` inside it.

If you want to view, build, or modify the test scenarios visually, open the JMeter GUI:
```bash
jmeter -t qa/jmeter/concurrent_ticket_update.jmx
```
