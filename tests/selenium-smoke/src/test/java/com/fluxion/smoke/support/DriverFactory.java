package com.fluxion.smoke.support;

import com.fluxion.smoke.config.TestConfig;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Factory that creates a configured ChromeDriver instance.
 *
 * Driver resolution strategy:
 *   1. Detect the installed Chrome binary and its major version.
 *   2. Set the {@code webdriver.chrome.driver} system property to the
 *      ChromeDriver binary that matches that version (downloaded on-demand via
 *      Selenium Manager, which is bundled with selenium-java 4.6+).
 *   3. If detection fails, Selenium Manager falls back to auto-resolution.
 */
public final class DriverFactory {

    private DriverFactory() {}

    public static WebDriver createChrome() {
        // Point Selenium Manager at the actual Chrome binary so it downloads
        // the matching ChromeDriver version automatically.
        String chromeBin = locateChromeBinary();
        if (chromeBin != null) {
            // SE_BROWSER_PATH is read by Selenium Manager to detect version
            System.setProperty("SE_BROWSER_PATH", chromeBin);
        }

        ChromeOptions options = new ChromeOptions();
        if (chromeBin != null) {
            options.setBinary(chromeBin);
        }
        if (TestConfig.headless()) {
            options.addArguments("--headless=new");
        }
        options.addArguments(
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--window-size=1920,1080",
            "--remote-allow-origins=*"
        );

        return new ChromeDriver(options);
    }

    /**
     * Locates the Chrome binary on common Linux / macOS / Windows paths.
     * Returns null if not found (Selenium Manager falls back to PATH detection).
     */
    private static String locateChromeBinary() {
        String[] candidates = {
            "/opt/google/chrome/chrome",
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium-browser",
            "/usr/bin/chromium",
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        };
        for (String path : candidates) {
            if (new java.io.File(path).canExecute()) {
                return path;
            }
        }
        return null;
    }

    /**
     * Captures a screenshot to {@code target/screenshots/<testName>-<timestamp>.png}.
     */
    public static String captureScreenshot(WebDriver driver, String testName) {
        try {
            byte[] src = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
            String timestamp = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
            Path dir = Paths.get(TestConfig.screenshotDir());
            Files.createDirectories(dir);
            Path dest = dir.resolve(testName + "-" + timestamp + ".png");
            Files.write(dest, src);
            return dest.toAbsolutePath().toString();
        } catch (IOException e) {
            return "screenshot-failed: " + e.getMessage();
        }
    }
}
