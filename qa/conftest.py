# qa/conftest.py
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


@pytest.fixture(scope="session")
def user_driver():
    """Selenium WebDriver for the User Frontend (FrontEnd/Fluxion)."""
    driver = _make_driver()
    driver.get("http://localhost:5173")   # Vite dev server — user frontend
    yield driver
    driver.quit()


@pytest.fixture(scope="session")
def admin_driver():
    """Selenium WebDriver for the Admin Dashboard (FluxionAdminDash)."""
    driver = _make_driver()
    driver.get("http://localhost:5174")   # Vite dev server — admin frontend
    yield driver
    driver.quit()


def _make_driver():
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=options
    )
    driver.implicitly_wait(10)
    driver.maximize_window()
    return driver
