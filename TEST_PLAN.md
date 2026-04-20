# Fluxion QA Test Plan — Sprint Complete

> **Branch strategy:** We develop on `dev` and deploy from `main`.  
> Every PR from `dev → main` must pass the fully automated 5-Layer QA pipeline defined below.

---

## 1. QA Gate Checklist

Before merging `dev → main`, our CI pipeline (`.github/workflows/qa.yml`) automatically verifies:

- [x] **Backend Tests**: `.NET xUnit` Unit and Integration tests pass.
- [x] **Frontend Unit Tests**: `Vitest` tests pass for the User App.
- [x] **Admin Unit Tests**: `Vitest` tests pass for the Admin Dashboard.
- [x] **Security Scan**: `TruffleHog` secrets check passes.

Additionally, manually or via nightly runs, verify:
- [ ] **Selenium E2E Tests**: Python GUI tests pass (especially RBAC suite).
- [ ] **JMeter Performance**: Load tests complete with 0% error rate.

---

## 2. The 5-Layer QA Strategy

| Layer | Framework | Location | Focus |
|-------|-----------|----------|-------|
| **1. User FrontEnd** | Vitest + jsdom | `FrontEnd/Fluxion/tests/` | Context providers, Services, API interceptors |
| **2. Admin FrontEnd** | Vitest + jsdom | `FluxionAdminDash/tests/` | Admin API services, Auth restoration, contexts |
| **3. BackEnd** | xUnit + Moq | `BackEnd/tests/` | .NET Services, Handlers, Controllers, Middleware |
| **4. End-to-End** | Python + Selenium | `qa/selenium/` | User flow, Role-Based Access Control (RBAC), Layout |
| **5. Performance** | Apache JMeter | `qa/jmeter/` | Pagination load tests, Ticket race-condition tests |

---

## 3. Running Tests Locally

### A. Frontend Services (Vitest)
Executes isolated JavaScript testing inside a simulated JSDOM environment. Super fast, no backend required.

```bash
# Run User Frontend tests (71 tests covering auth, maintenance, assets, tickets)
cd FrontEnd/Fluxion
npm test

# Run Admin Dashboard tests (17 tests covering CRUD, auth contexts)
cd FluxionAdminDash
npm test
```

### B. Backend Core (.NET)
Executes in-memory DB tests for C# CQRS handlers.
```bash
# Run 149 Unit Tests 
cd BackEnd
dotnet test tests/Fluxion.UnitTests/

# Run 35 Integration Tests (Spins up HTTP pipeline)
dotnet test tests/Fluxion.IntegrationTests/
```
*(Note: One test `Endpoints_ShouldNotContainDebugOnlyComments` intentionally fails to document a known debug-code security issue, SEC-04).*

### C. End-to-End Automation (Selenium)
Python-based WebDriver scripts that physically click through the DOM.
**Important:** Your backend (`dotnet run`) and frontend servers (`npm run dev`) must be running first.

```bash
cd qa
# Install prerequisites once: 
pip install pytest selenium webdriver-manager

# Run the full suite using Python module (safest execution method)
python -m pytest selenium/tests/ -v
```

**Key Selenium Suites available:**
- `test_01_public_pages.py`: Landing view and 404 fallbacks
- `test_02_auth.py`: Login, remember-me persistence, logout
- `test_03_rbac.py`: **Critical Suite** - Tests 76 combinations of Users × Routes to ensure Admin endpoints are strictly isolated.
- `test_04_navigation.py`: Sidebar, notifications, and responsive breakpoints.

### D. Performance Stress Testing (JMeter)
Simulates high concurrent user traffic against the live Web API.

```bash
cd qa/jmeter
# 1. 50 Concurrent users polling pagination lists
jmeter -n -t asset_pagination_load.jmx -l results.json -e -o ./report/

# 2. 20 Concurrent technicians trying to assign the very same ticket instantly
jmeter -n -t concurrent_ticket_update.jmx -l results2.json -e -o ./report2/
```
*(You must provide a valid `AUTH_TOKEN` inside the JMeter GUI variable settings before running).*

---

## 4. Discovered Roles & Access Matrix

All End-to-End testing targets the following core roles:

| Role | Access Scope |
|------|--------------|
| **Owner** | Full system rights. Accesses `FluxionAdminDash`. Can view/export warranty reports. |
| **SystemAdmin** / **Admin** | Application configuration, Users, Departments, Assets. |
| **Manager** | Departmental oversight, approvals, maintenance overview. |
| **Technician** | Tech Portal (`/technician/dashboard`). Resolves tickets, updates asset conditions. |
| **User** | Default employee. Logs tickets, views their currently assigned assets. |

Selenium physically tests the boundaries between these roles (see `qa/selenium/config.py` for the route-to-role matrix).

---

## 5. Known Flaky Tests / Exceptions

1. **Google Auth**: Google Sign-in cannot be automated effectively in Selenium due to CAPTCHAs. This must be tested manually or via an integration mock (future).
2. **React Hydration Races**: We added JavaScript click fallbacks into `qa/selenium/pages/base_page.py` because loading toasts and floating headers sometimes intercept standard Selenium clicks in our dynamic React app.
3. **SEC-04 Alert**: The backend `AssetControllerTests.cs` explicitly fails because a `catch(Exception)` block is returning detailed stack traces containing `ex.InnerException?.Message` directly to the client. This is fully documented and caught by the test.
