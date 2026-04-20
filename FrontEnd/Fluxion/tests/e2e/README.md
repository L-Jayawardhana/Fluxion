# User Frontend — Tests

This directory maintains the automated testing suites for the **User Frontend** (`FrontEnd/Fluxion`).

## 1. Unit & Service Tests (Vitest)

We use `Vitest` with `jsdom` to test React components and API HTTP service wrappers locally.

### Running Vitest
Run this from `FrontEnd/Fluxion/`:
```bash
npm test
```

### Coverage
- **`tests/services/`**: Covers API wrappers for `authService`, `technicianService`, `maintenanceService`, `warrantyService`, etc. Validates data transformation, payload shape, and interceptor behaviors.
- **`src/components/PaymentModal/`**: Pre-existing component logic tests for layout validation.

---

## 2. End-to-End Tests (Selenium)

While the isolated unit tests live in this directory, the **Shared End-To-End Browser Tests** live globally at the root of the repository in the `qa/selenium/` folder.

This is because E2E tests often require coordinating both applications (User App + Admin App) checking cross-compatibility (like an Admin creating an asset, and a User viewing it).

### Running Selenium tests
To run the automated Python tests that drive the Chrome browser, start both the .NET backend and Vite frontend, then:

```bash
cd ../../qa
python -m pytest selenium/tests/ -v
```

Reference the [QA Directory README](../../qa/README.md) and the root [TEST_PLAN.md](../../TEST_PLAN.md) for deeper instructions on the RBAC Selenium matrix.
