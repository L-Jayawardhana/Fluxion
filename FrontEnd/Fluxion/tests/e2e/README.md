# User Frontend — E2E Tests

This directory is for Selenium-based end-to-end tests for the **User Frontend** (`FrontEnd/Fluxion`).

## Setup

E2E tests use the shared Selenium configuration from `qa/conftest.py` at repository root.

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.10+ | Test runtime |
| Chrome | Latest stable | Selenium WebDriver |
| pip packages | `selenium`, `pytest`, `webdriver-manager` | Test dependencies |

### Running Tests

```bash
# From repository root
pytest FrontEnd/Fluxion/tests/e2e/ --rootdir=qa/

# Or with the shared conftest
pytest FrontEnd/Fluxion/tests/e2e/ -c qa/conftest.py
```

### Writing Tests

Use the `user_driver` fixture from `qa/conftest.py`:

```python
def test_login_page_loads(user_driver):
    user_driver.get("http://localhost:5173/login")
    assert "login" in user_driver.current_url.lower()
```

## Smoke Tests Covered

| ID | What is checked |
|----|----------------|
| SMOKE-01 | Login page loads — email field + submit button visible |
| SMOKE-02 | Register page loads — Step-1 form visible |
| SMOKE-03 | Wrong password shows error banner, stays on `/login` |
| SMOKE-04 | Empty form submit stays on `/login` (HTML5 validation) |
| SMOKE-05 | Unauthenticated `/dashboard` access redirects to `/login` |
