# qa/selenium/pages/login_page.py
"""
Page Object for the Login page (/login).
"""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class LoginPage(BasePage):
    """Encapsulates interactions with the Fluxion login page."""

    # ── Locators ─────────────────────────────────────────────────────
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[type='email']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password']")
    LOGIN_BUTTON = (By.CSS_SELECTOR, "button[type='submit']")
    REMEMBER_ME = (By.CSS_SELECTOR, "input[type='checkbox']")
    ERROR_MESSAGE = (By.CSS_SELECTOR, ".login-alert-error, .error, [class*='error']")
    FORGOT_PASSWORD_LINK = (By.LINK_TEXT, "Forgot password?")
    SIGN_UP_LINK = (By.PARTIAL_LINK_TEXT, "Sign up")

    def __init__(self, driver, base_url="http://localhost:5173"):
        super().__init__(driver)
        self.base_url = base_url

    def open_page(self):
        self.open(f"{self.base_url}/login")

    def enter_email(self, email):
        self.type_text(self.EMAIL_INPUT, email)

    def enter_password(self, password):
        self.type_text(self.PASSWORD_INPUT, password)

    def check_remember_me(self):
        checkbox = self.find(self.REMEMBER_ME)
        if not checkbox.is_selected():
            checkbox.click()

    def click_login(self):
        self.click(self.LOGIN_BUTTON)

    def login(self, email, password, remember_me=False):
        """Full login flow: enter credentials and submit."""
        self.open_page()
        self.enter_email(email)
        self.enter_password(password)
        if remember_me:
            self.check_remember_me()
        self.click_login()

    def get_error_message(self):
        try:
            return self.get_text(self.ERROR_MESSAGE)
        except Exception:
            return None

    def is_on_login_page(self):
        return "/login" in self.current_url
