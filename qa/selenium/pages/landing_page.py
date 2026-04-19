# qa/selenium/pages/landing_page.py
"""
Page Object for the Landing page (/).
"""
from selenium.webdriver.common.by import By
from .base_page import BasePage


class LandingPage(BasePage):
    """Encapsulates interactions with the Fluxion landing page."""

    # ── Locators ─────────────────────────────────────────────────────
    HERO_TITLE = (By.CSS_SELECTOR, ".hero-title, h1")
    GET_STARTED_CTA = (By.CSS_SELECTOR, "a[href='/register']")
    PRICING_SECTION = (By.CSS_SELECTOR, ".pricing-section, #pricing, [class*='pricing']")
    PLAN_BUTTONS = (By.CSS_SELECTOR, ".plan-btn")
    FOOTER = (By.CSS_SELECTOR, "footer")
    NAV_LINKS = (By.CSS_SELECTOR, "nav a, .nav-link")

    def __init__(self, driver, base_url="http://localhost:5173"):
        super().__init__(driver)
        self.base_url = base_url

    def open_page(self):
        self.open(self.base_url)

    def get_hero_text(self):
        return self.get_text(self.HERO_TITLE)

    def click_get_started(self):
        self.click(self.GET_STARTED_CTA)

    def get_plan_buttons(self):
        try:
            return self.find_all(self.PLAN_BUTTONS)
        except Exception:
            return []

    def is_footer_visible(self):
        try:
            return self.find(self.FOOTER).is_displayed()
        except Exception:
            return False
