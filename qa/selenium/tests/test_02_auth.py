# qa/selenium/tests/test_02_auth.py
"""
Authentication E2E tests.
Covers: Login, session storage, remember me, validation errors.
"""
import time
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from config import BASE_URL, USERS
from pages.login_page import LoginPage


class TestLogin:
    """End-to-end tests for the login flow."""

    def test_login_page_renders(self, user_driver):
        page = LoginPage(user_driver, BASE_URL)
        page.open_page()
        assert page.is_on_login_page()

    def test_empty_form_stays_on_login(self, user_driver):
        page = LoginPage(user_driver, BASE_URL)
        page.open_page()
        page.click_login()
        time.sleep(1)
        assert page.is_on_login_page(), "Should stay on login page with empty fields"

    def test_invalid_credentials_shows_error(self, user_driver):
        page = LoginPage(user_driver, BASE_URL)
        page.login("wrong@email.com", "WrongPass123!")
        time.sleep(2)
        assert page.is_on_login_page(), "Should stay on login page with wrong credentials"

    def test_valid_login_redirects_away(self, user_driver):
        page = LoginPage(user_driver, BASE_URL)
        page.clear_auth()
        page.login(USERS["owner"]["email"], USERS["owner"]["password"])
        time.sleep(3)
        assert "/login" not in page.current_url, \
            f"Expected redirect away from /login, but still at {page.current_url}"

    def test_remember_me_stores_in_localstorage(self, user_driver):
        page = LoginPage(user_driver, BASE_URL)
        page.clear_auth()
        page.login(USERS["owner"]["email"], USERS["owner"]["password"], remember_me=True)
        time.sleep(3)
        token = user_driver.execute_script("return localStorage.getItem('token');")
        assert token is not None, "Token should be in localStorage when remember me is checked"

    def test_no_remember_me_stores_in_sessionstorage(self, user_driver):
        page = LoginPage(user_driver, BASE_URL)
        page.clear_auth()
        page.login(USERS["owner"]["email"], USERS["owner"]["password"], remember_me=False)
        time.sleep(3)
        token = user_driver.execute_script("return sessionStorage.getItem('token');")
        assert token is not None, "Token should be in sessionStorage when remember me is unchecked"


class TestLogout:
    """Tests for the logout flow."""

    def test_clearing_token_redirects_to_login(self, user_driver):
        # First login
        page = LoginPage(user_driver, BASE_URL)
        page.login(USERS["owner"]["email"], USERS["owner"]["password"])
        time.sleep(2)

        # Clear storage to simulate logout/expiry
        page.clear_auth()
        user_driver.get(f"{BASE_URL}/dashboard")
        time.sleep(2)

        assert "/login" in page.current_url, \
            "Should redirect to /login when token is cleared"
