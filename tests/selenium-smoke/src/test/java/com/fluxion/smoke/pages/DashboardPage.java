package com.fluxion.smoke.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

/**
 * Page Object for the Dashboard page at /dashboard.
 * This page is auth-guarded — unauthenticated users are redirected to /login.
 */
public class DashboardPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    private static final By DASHBOARD_HEADING = By.cssSelector("h1");
    private static final By SPLASH_SCREEN    = By.cssSelector("#splash-screen");

    public DashboardPage(WebDriver driver, int waitSeconds) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(waitSeconds));
    }

    private void waitForPageToLoad() {
        // Wait for splash screen to disappear if present
        try {
            wait.until(ExpectedConditions.invisibilityOfElementLocated(SPLASH_SCREEN));
        } catch (Exception e) {
            // Splash screen might not be present, continue
        }
    }

    public boolean isOnDashboard() {
        try {
            wait.until(d -> d.getCurrentUrl().contains("/dashboard"));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Navigating to /dashboard without a JWT should redirect to /login.
     * This verifies the auth-guard is active.
     */
    public boolean isRedirectedToLoginWhenUnauthenticated(String baseUrl) {
        driver.navigate().to(baseUrl.replaceAll("/$", "") + "/dashboard");
        waitForPageToLoad();
        try {
            wait.until(d -> d.getCurrentUrl().contains("/login"));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public void logout(String baseUrl) {
        ((JavascriptExecutor) driver).executeScript("localStorage.removeItem('token');");
        driver.navigate().to(baseUrl.replaceAll("/$", "") + "/login");
    }
}
