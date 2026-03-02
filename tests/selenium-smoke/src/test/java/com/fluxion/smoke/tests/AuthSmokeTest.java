package com.fluxion.smoke.tests;

import com.fluxion.smoke.config.TestConfig;
import com.fluxion.smoke.pages.DashboardPage;
import com.fluxion.smoke.pages.LoginPage;
import com.fluxion.smoke.pages.RegisterPage;
import com.fluxion.smoke.support.DriverFactory;
import org.junit.jupiter.api.*;
import org.openqa.selenium.WebDriver;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         Fluxion — Authentication UI Smoke Tests              ║
 * ║                                                              ║
 * ║  Tag: @Tag("smoke")                                          ║
 * ║  Purpose: Fast CI checks that critical pages load and        ║
 * ║           basic validation paths work.                       ║
 * ║                                                              ║
 * ║  Prerequisites:                                              ║
 * ║    • Frontend running at selenium.baseUrl                    ║
 * ║    •  (headless Chrome via WebDriverManager)                 ║
 * ║                                                              ║
 * ║  These tests do NOT require:                                 ║
 * ║    • A live backend                                          ║
 * ║    • Pre-seeded users                                        ║
 * ║    • Email verification                                      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
@Tag("smoke")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Authentication Smoke Tests")
class AuthSmokeTest {

    private static WebDriver driver;
    private static LoginPage loginPage;
    private static RegisterPage registerPage;
    private static DashboardPage dashboardPage;
    private static final String BASE_URL = TestConfig.baseUrl();

    @BeforeAll
    static void setUpDriver() {
        driver = DriverFactory.createChrome();
        loginPage      = new LoginPage(driver, TestConfig.explicitWaitSeconds());
        registerPage   = new RegisterPage(driver, TestConfig.explicitWaitSeconds());
        dashboardPage  = new DashboardPage(driver, TestConfig.explicitWaitSeconds());
    }

    @AfterAll
    static void tearDownDriver() {
        if (driver != null) {
            driver.quit();
        }
    }

    @AfterEach
    void captureOnFailure(TestInfo info) {
        // Screenshot is captured by the extension method below on failure;
        // here we just print current URL for diagnostics.
        System.out.println("[smoke] current URL after test: " + driver.getCurrentUrl());
    }

    // ── 1. Login page loads ───────────────────────────────────────

    @Test
    @Order(1)
    @DisplayName("SMOKE-01 | Login page loads and shows email + password fields")
    void loginPage_Loads_ShowsForm() {
        try {
            loginPage.navigateTo(BASE_URL);

            assertThat(loginPage.isPageLoaded())
                .as("Login page should load with email and submit button visible")
                .isTrue();
            assertThat(loginPage.isOnLoginPage())
                .as("URL should contain /login")
                .isTrue();
        } catch (Exception e) {
            String path = DriverFactory.captureScreenshot(driver, "SMOKE-01-loginPageLoads");
            System.err.println("📸 Screenshot: " + path);
            throw e;
        }
    }

    // ── 2. Register page loads ────────────────────────────────────

    @Test
    @Order(2)
    @DisplayName("SMOKE-02 | Register page loads and shows Step-1 form")
    void registerPage_Loads_ShowsStep1Form() {
        try {
            registerPage.navigateTo(BASE_URL);

            assertThat(registerPage.isOnRegisterPage())
                .as("URL should contain /register")
                .isTrue();
            assertThat(registerPage.isPageLoaded())
                .as("Register Step-1 fields (firstName, email) should be visible")
                .isTrue();
        } catch (Exception e) {
            String path = DriverFactory.captureScreenshot(driver, "SMOKE-02-registerPageLoads");
            System.err.println("📸 Screenshot: " + path);
            throw e;
        }
    }

    // ── 3. Login validation: wrong credentials ────────────────────

    @Test
    @Order(3)
    @DisplayName("SMOKE-03 | Login with wrong password shows an error message")
    void login_WrongPassword_ShowsError() {
        try {
            loginPage.navigateTo(BASE_URL);
            loginPage.login("nobody@fluxion.dev", "Wr0ngP@ssw0rd!");

            assertThat(loginPage.isErrorDisplayed())
                .as("Wrong password should display an error banner")
                .isTrue();
            assertThat(loginPage.isOnLoginPage())
                .as("Page should stay at /login after failed login")
                .isTrue();
        } catch (Exception e) {
            String path = DriverFactory.captureScreenshot(driver, "SMOKE-03-wrongPassword");
            System.err.println("📸 Screenshot: " + path);
            throw e;
        }
    }

    // ── 4. Login validation: empty form ──────────────────────────

    @Test
    @Order(4)
    @DisplayName("SMOKE-04 | Clicking sign-in with empty fields keeps user on /login")
    void login_EmptyFields_StaysOnLoginPage() {
        try {
            loginPage.navigateTo(BASE_URL);
            loginPage.clickSignIn();

            assertThat(loginPage.isOnLoginPage())
                .as("Empty form should not navigate away from /login")
                .isTrue();
        } catch (Exception e) {
            String path = DriverFactory.captureScreenshot(driver, "SMOKE-04-emptyLogin");
            System.err.println("📸 Screenshot: " + path);
            throw e;
        }
    }

    // ── 5. Auth-guard: unauthenticated access to /dashboard ───────

    @Test
    @Order(5)
    @DisplayName("SMOKE-05 | Unauthenticated access to /dashboard redirects to /login")
    void dashboard_UnauthenticatedAccess_RedirectsToLogin() {
        try {
            // Clear any stored token first
            driver.navigate().to(BASE_URL);
            try {
                ((org.openqa.selenium.JavascriptExecutor) driver)
                    .executeScript("localStorage.clear(); sessionStorage.clear();");
            } catch (Exception ignored) {
                // page may not support JS storage (e.g., blank page) — safe to ignore
            }

            boolean redirected = dashboardPage.isRedirectedToLoginWhenUnauthenticated(BASE_URL);

            assertThat(redirected)
                .as("Auth-guard should redirect unauthenticated users from /dashboard to /login")
                .isTrue();
        } catch (Exception e) {
            String path = DriverFactory.captureScreenshot(driver, "SMOKE-05-authGuard");
            System.err.println("📸 Screenshot: " + path);
            throw e;
        }
    }
}
