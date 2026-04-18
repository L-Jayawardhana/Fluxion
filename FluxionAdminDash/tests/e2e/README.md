# Admin Dashboard — E2E Tests

This directory is for Selenium-based end-to-end tests for the **Admin Dashboard** (`FluxionAdminDash`).

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
pytest FluxionAdminDash/tests/e2e/ --rootdir=qa/

# Or with the shared conftest
pytest FluxionAdminDash/tests/e2e/ -c qa/conftest.py
```

### Writing Tests

Use the `admin_driver` fixture from `qa/conftest.py`:

```python
def test_admin_login_page_loads(admin_driver):
    admin_driver.get("http://localhost:5174/login")
    assert "login" in admin_driver.current_url.lower()
```
