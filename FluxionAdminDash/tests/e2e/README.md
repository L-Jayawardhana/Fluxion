# Admin Dashboard — Tests

This directory maintains the automated testing suites for the **Admin Dashboard** (`FluxionAdminDash`).

## 1. Unit & Service Tests (Vitest)

We use `Vitest` with `jsdom` to test context states and API interactions natively without full browser overhead.

### Running Vitest
Run this from `FluxionAdminDash/`:
```bash
npm test
```

### Coverage
- **`tests/context/AuthContext.test.jsx`**: Validates login, logout, state restoration from `localStorage`, and deep edge-cases for Admin JWT authentication.
- **`tests/services/api.test.js`**: Thorough coverage over the main CRUD API functions powering the dashboard (Departments, Subscriptions, Users).

---

## 2. End-to-End Tests (Selenium)

While local React/Context limits tests live here, the **Full End-To-End Browser Tests** live globally at the root of the repository in the `qa/selenium/` folder.

Admin Dash E2E testing relies heavily on the `test_03_rbac.py` framework, ensuring that only Owner/Manager level permissions unlock the dashboard routing capabilities dynamically.

### Running Selenium tests
Start your backend and frontend. Then:
```bash
cd ../../qa
python -m pytest selenium/tests/ -v
```

Reference the [QA Directory README](../../qa/README.md) and the root [TEST_PLAN.md](../../TEST_PLAN.md) for full instructions regarding the Selenium and JMeter deployments.
