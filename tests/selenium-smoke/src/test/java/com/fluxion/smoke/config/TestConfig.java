package com.fluxion.smoke.config;

/**
 * Reads test configuration from system properties (set by Maven Surefire)
 * or falls back to sensible defaults.
 *
 * Supported system properties / env overrides:
 *   selenium.baseUrl    — Frontend URL (default: http://localhost:5173)
 *   selenium.apiBaseUrl — Backend URL  (default: http://localhost:5226/api)
 *   selenium.headless   — Run Chrome headless (default: true)
 */
public final class TestConfig {

    private TestConfig() {}

    public static String baseUrl() {
        return System.getProperty("selenium.baseUrl",
               System.getenv().getOrDefault("SELENIUM_BASE_URL", "http://localhost:5173"));
    }

    public static String apiBaseUrl() {
        return System.getProperty("selenium.apiBaseUrl",
               System.getenv().getOrDefault("SELENIUM_API_BASE_URL", "http://localhost:5226/api"));
    }

    public static boolean headless() {
        String val = System.getProperty("selenium.headless",
                     System.getenv().getOrDefault("SELENIUM_HEADLESS", "true"));
        return Boolean.parseBoolean(val);
    }

    public static int explicitWaitSeconds() {
        String val = System.getProperty("selenium.explicitWait",
                     System.getenv().getOrDefault("SELENIUM_EXPLICIT_WAIT", "10"));
        return Integer.parseInt(val);
    }

    public static String screenshotDir() {
        return System.getProperty("selenium.screenshotDir",
               System.getenv().getOrDefault("SELENIUM_SCREENSHOT_DIR", "target/screenshots"));
    }
}
