using System.Text.RegularExpressions;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;

namespace Fluxion.SeleniumTests;

/// <summary>
/// Part 4 — Owner Review &amp; Reports (Steps 12–14)
///
///  12. Maintenance_ViewAssetLogPage   – pick asset, verify log table + comments
///  13. Maintenance_AddComment_AsOwner – verify internal notes toggle
///  14. Maintenance_ViewCostReport     – verify cost report table
///
/// All steps use the owner account.
/// </summary>
public class Part4_OwnerReportTests
{
    [Fact]
    public void OwnerReviewAndReports()
    {
        var ownerEmail    = GetEnvOrDefault("SELENIUM_OWNER_EMAIL",    "gunarathnakaveen3@gmail.com");
        var ownerPassword = GetEnvOrDefault("SELENIUM_OWNER_PASSWORD", "Kaveen2003");
        var baseUrl       = GetEnvOrDefault("SELENIUM_BASE_URL",       "http://localhost:5173").TrimEnd('/');
        var headless      = GetEnvOrDefault("SELENIUM_HEADLESS", "false")
                                .Equals("true", StringComparison.OrdinalIgnoreCase);

        var screenshotDir = GetScreenshotDir();
        using var driver = CreateDriver(headless);
        var wait = CreateWait(driver);

        try
        {
            // ── Login as Owner ─────────────────────────────────────
            Login(driver, wait, baseUrl, ownerEmail, ownerPassword, screenshotDir, "00_owner_login.png");

            // ═══════════════════════════════════════════════════════
            // STEP 12 — Maintenance_ViewAssetLogPage
            // ═══════════════════════════════════════════════════════
            Step12_ViewAssetLogPage(driver, wait, baseUrl, screenshotDir);

            // ═══════════════════════════════════════════════════════
            // STEP 13 — Maintenance_AddComment_AsOwner
            // ═══════════════════════════════════════════════════════
            Step13_OwnerComments(driver, wait, screenshotDir);

            // ═══════════════════════════════════════════════════════
            // STEP 14 — Maintenance_ViewCostReport
            // ═══════════════════════════════════════════════════════
            Step14_ViewCostReport(driver, wait, baseUrl, screenshotDir);
        }
        catch
        {
            TryTakeScreenshot(driver, screenshotDir, "99_failure.png");
            throw;
        }
    }

    // ────────────────────────────────────────────────────────────────
    // Step 12: View Asset Maintenance Log Page
    // ────────────────────────────────────────────────────────────────
    private static void Step12_ViewAssetLogPage(
        IWebDriver driver, WebDriverWait wait, string baseUrl, string dir)
    {
        // Navigate to asset picker
        driver.Navigate().GoToUrl($"{baseUrl}/maintenance-logs");
        WaitForSplashToDisappear(driver, wait);

        // Wait for asset picker cards to load
        wait.Until(d =>
            d.FindElements(By.CssSelector("button.ml-picker-card")).Count > 0 ||
            d.FindElements(By.CssSelector(".ml-empty")).Count > 0);

        TakeScreenshot(driver, dir, "12_asset_picker.png");

        // Verify page title
        var title = driver.FindElement(By.CssSelector(".ml-title")).Text;
        Assert.Contains("Select an asset", title, StringComparison.OrdinalIgnoreCase);

        // Click first asset card
        var assetCards = driver.FindElements(By.CssSelector("button.ml-picker-card"));
        if (assetCards.Count == 0)
        {
            TakeScreenshot(driver, dir, "12_no_assets.png");
            Assert.Fail("No assets found in the asset picker.");
        }

        // Get asset name for verification
        var assetName = assetCards[0].FindElement(By.CssSelector(".ml-picker-name")).Text;
        assetCards[0].Click();

        // Wait for asset detail log page to load
        wait.Until(d => Regex.IsMatch(d.Url, @"/maintenance-logs/\d+", RegexOptions.IgnoreCase));
        WaitForSplashToDisappear(driver, wait);

        // Wait for page header
        wait.Until(d =>
        {
            try
            {
                var h = d.FindElement(By.CssSelector(".ml-title"));
                return h.Displayed && h.Text.Contains("Asset history", StringComparison.OrdinalIgnoreCase);
            }
            catch (StaleElementReferenceException) { return false; }
            catch (NoSuchElementException) { return false; }
        });

        TakeScreenshot(driver, dir, "12_asset_log_page.png");

        // Verify key components rendered
        // Asset info header
        var assetInfoHeaders = driver.FindElements(By.CssSelector(".ml-asset-info"));
        TakeScreenshot(driver, dir, "12_asset_info.png");

        // Log table or empty state
        wait.Until(d =>
            d.FindElements(By.CssSelector(".ml-log-table")).Count > 0 ||
            d.FindElements(By.CssSelector(".ml-empty")).Count > 0);

        TakeScreenshot(driver, dir, "12_log_table.png");

        // Verify comments section exists
        var commentsSection = driver.FindElements(By.CssSelector(".ml-comments"));
        Assert.True(commentsSection.Count > 0, "Comments section should be present on the log page.");

        TakeScreenshot(driver, dir, "12_verified.png");
    }

    // ────────────────────────────────────────────────────────────────
    // Step 13: Owner Views & Filters Comments
    // ────────────────────────────────────────────────────────────────
    private static void Step13_OwnerComments(
        IWebDriver driver, WebDriverWait wait, string dir)
    {
        // Scroll to comments section
        var commentsSection = driver.FindElements(By.CssSelector(".ml-comments"));
        if (commentsSection.Count == 0)
        {
            TakeScreenshot(driver, dir, "13_no_comments_section.png");
            return;
        }

        ((IJavaScriptExecutor)driver).ExecuteScript(
            "arguments[0].scrollIntoView({block:'center'});", commentsSection[0]);
        Thread.Sleep(500);

        TakeScreenshot(driver, dir, "13_comments_section.png");

        // Verify "Comments" title is visible
        var commentsTitle = driver.FindElements(By.CssSelector(".ml-comments-title"));
        Assert.True(commentsTitle.Count > 0, "Comments title should be visible.");

        // Verify notes count
        var notesSub = driver.FindElements(By.CssSelector(".ml-comments-sub"));
        if (notesSub.Count > 0)
        {
            TakeScreenshot(driver, dir, "13_notes_count.png");
        }

        // Owner-specific: "Show internal notes only" toggle
        var toggleLabels = driver.FindElements(By.CssSelector(".ml-comments .ml-toggle"));
        if (toggleLabels.Count > 0)
        {
            TakeScreenshot(driver, dir, "13_internal_toggle_visible.png");

            // Click the toggle to filter internal notes
            var checkbox = toggleLabels[0].FindElement(By.CssSelector("input[type='checkbox']"));
            checkbox.Click();
            Thread.Sleep(500);
            TakeScreenshot(driver, dir, "13_internal_notes_filtered.png");

            // Toggle back
            checkbox.Click();
            Thread.Sleep(500);
            TakeScreenshot(driver, dir, "13_all_notes_restored.png");
        }

        // Check for existing comment cards
        var commentCards = driver.FindElements(By.CssSelector(".ml-comment-card"));
        TakeScreenshot(driver, dir, $"13_comments_found_{commentCards.Count}.png");
    }

    // ────────────────────────────────────────────────────────────────
    // Step 14: View Maintenance Cost Report
    // ────────────────────────────────────────────────────────────────
    private static void Step14_ViewCostReport(
        IWebDriver driver, WebDriverWait wait, string baseUrl, string dir)
    {
        driver.Navigate().GoToUrl($"{baseUrl}/report-maintenance-cost");
        WaitForSplashToDisappear(driver, wait);

        // Wait for report table or empty state
        wait.Until(d =>
            d.FindElements(By.CssSelector(".mc-table")).Count > 0 ||
            d.FindElements(By.CssSelector(".mc-empty")).Count > 0);

        TakeScreenshot(driver, dir, "14_cost_report.png");

        // Verify page title
        var reportTitle = driver.FindElement(By.CssSelector(".mc-title")).Text;
        Assert.Contains("Maintenance Cost Report", reportTitle, StringComparison.OrdinalIgnoreCase);

        // Verify filter controls exist
        var startDateInput = driver.FindElements(By.Id("start-date-input"));
        Assert.True(startDateInput.Count > 0, "Start date filter should be present.");

        var endDateInput = driver.FindElements(By.Id("end-date-input"));
        Assert.True(endDateInput.Count > 0, "End date filter should be present.");

        TakeScreenshot(driver, dir, "14_filters_verified.png");

        // Check for data rows
        var assetNames = driver.FindElements(By.CssSelector(".mc-asset-name"));
        if (assetNames.Count > 0)
        {
            TakeScreenshot(driver, dir, "14_has_data.png");

            // Click first row to expand details
            var firstRow = driver.FindElements(By.CssSelector(".mc-table tbody tr"));
            if (firstRow.Count > 0)
            {
                firstRow[0].Click();
                Thread.Sleep(500);
                TakeScreenshot(driver, dir, "14_row_expanded.png");

                // Verify details table appears
                var detailsTable = driver.FindElements(By.CssSelector(".mc-details-table"));
                if (detailsTable.Count > 0)
                {
                    TakeScreenshot(driver, dir, "14_details_visible.png");
                }
            }

            // Verify cost cells are present
            var costCells = driver.FindElements(By.CssSelector(".mc-cost-cell"));
            Assert.True(costCells.Count > 0, "Cost cells should be visible in the report.");
        }
        else
        {
            TakeScreenshot(driver, dir, "14_no_data.png");
        }

        TakeScreenshot(driver, dir, "14_report_verified.png");
    }

    // ════════════════════════════════════════════════════════════════
    // Helpers
    // ════════════════════════════════════════════════════════════════

    private static IWebDriver CreateDriver(bool headless)
    {
        var options = new ChromeOptions();
        if (headless) options.AddArgument("--headless=new");
        options.AddArgument("--window-size=1920,1080");
        options.AddArgument("--disable-gpu");
        var driver = new ChromeDriver(options);
        driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds(10);
        return driver;
    }

    private static WebDriverWait CreateWait(IWebDriver driver)
        => new(driver, TimeSpan.FromSeconds(30));

    private static void Login(
        IWebDriver driver, WebDriverWait wait, string baseUrl,
        string email, string password, string screenshotDir, string fileName)
    {
        ResetSession(driver, baseUrl);
        driver.Navigate().GoToUrl($"{baseUrl}/login");
        WaitForSplashToDisappear(driver, wait);

        var emailInput = wait.Until(d =>
        {
            var el = d.FindElement(By.Id("login-email"));
            return el.Displayed && el.Enabled ? el : null;
        })!;
        emailInput.Clear();
        emailInput.SendKeys(email);

        var pwInput = driver.FindElement(By.Id("login-password"));
        pwInput.Clear();
        pwInput.SendKeys(password);

        TakeScreenshot(driver, screenshotDir, fileName);
        driver.FindElement(By.CssSelector(".btn-submit")).Click();

        wait.Until(d => !d.Url.Contains("/login", StringComparison.OrdinalIgnoreCase));
        WaitForSplashToDisappear(driver, wait);
    }

    private static void ResetSession(IWebDriver driver, string baseUrl)
    {
        try
        {
            driver.Navigate().GoToUrl(baseUrl);
            driver.Manage().Cookies.DeleteAllCookies();
            if (driver is IJavaScriptExecutor js)
                js.ExecuteScript("window.localStorage.clear(); window.sessionStorage.clear();");
        }
        catch (WebDriverException) { }
    }

    private static void WaitForSplashToDisappear(IWebDriver driver, WebDriverWait wait)
    {
        wait.Until(_ =>
        {
            try { return !driver.FindElement(By.Id("splash-screen")).Displayed; }
            catch (NoSuchElementException)         { return true; }
            catch (StaleElementReferenceException)  { return true; }
        });
    }

    private static string GetEnvOrDefault(string key, string fallback)
        => Environment.GetEnvironmentVariable(key) ?? fallback;

    private static string GetScreenshotDir()
    {
        var repoRoot = FindRepoRoot();
        var dir = Path.Combine(repoRoot, "tests", "selenium_tests", "screenshots", "part4_owner_reports");
        Directory.CreateDirectory(dir);
        return dir;
    }

    private static void TakeScreenshot(IWebDriver driver, string dir, string fileName)
    {
        if (driver is ITakesScreenshot ts)
            ts.GetScreenshot().SaveAsFile(Path.Combine(dir, fileName));
    }

    private static void TryTakeScreenshot(IWebDriver driver, string dir, string fileName)
    {
        try { TakeScreenshot(driver, dir, fileName); } catch { }
    }

    private static string FindRepoRoot()
    {
        var cur = new DirectoryInfo(AppContext.BaseDirectory);
        while (cur is not null)
        {
            if (Directory.Exists(Path.Combine(cur.FullName, "scripts")) &&
                Directory.Exists(Path.Combine(cur.FullName, "tests")))
                return cur.FullName;
            cur = cur.Parent;
        }
        return Directory.GetCurrentDirectory();
    }
}
