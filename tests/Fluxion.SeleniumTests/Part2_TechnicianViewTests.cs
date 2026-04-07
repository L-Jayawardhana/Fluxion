using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;

namespace Fluxion.SeleniumTests;

/// <summary>
/// Part 2 — Technician Views &amp; Filters
/// Steps 4–7 of the full maintenance lifecycle.
///
///  4. Technician_ViewDashboardStats     – verify KPI cards load
///  5. Technician_ViewAssignedTickets    – verify ticket list renders
///  6. Technician_FilterTickets_ByStatus – use status dropdown filter
///  7. Technician_ViewTicketDetail       – click a card, verify detail page
///
/// All steps use the technician account and run in order within a single test.
/// </summary>
public class Part2_TechnicianViewTests
{
    [Fact]
    public void TechnicianViewsAndFilters()
    {
        var techEmail    = GetEnvOrDefault("SELENIUM_TECHNICIAN_EMAIL",    "it23746664@my.sliit.lk");
        var techPassword = GetEnvOrDefault("SELENIUM_TECHNICIAN_PASSWORD", "gunarathna2003");
        var baseUrl      = GetEnvOrDefault("SELENIUM_BASE_URL",            "http://localhost:5173").TrimEnd('/');
        var headless     = GetEnvOrDefault("SELENIUM_HEADLESS", "false").Equals("true", StringComparison.OrdinalIgnoreCase);

        var screenshotDir = GetScreenshotDir();

        using var driver = CreateDriver(headless);
        var wait = CreateWait(driver);

        try
        {
            // ── Login as Technician ────────────────────────────────
            Login(driver, wait, baseUrl, techEmail, techPassword, screenshotDir, "00_tech_login.png");

            // ═══════════════════════════════════════════════════════
            // STEP 4 — Technician_ViewDashboardStats
            // ═══════════════════════════════════════════════════════
            driver.Navigate().GoToUrl($"{baseUrl}/technician/dashboard");
            WaitForSplashToDisappear(driver, wait);

            // Wait for at least 4 KPI cards to render
            wait.Until(d => d.FindElements(By.CssSelector(".tc-kpi")).Count >= 4);
            TakeScreenshot(driver, screenshotDir, "04_dashboard_stats.png");

            // Verify all 4 KPI labels are present
            var kpiLabels = driver.FindElements(By.CssSelector(".tc-kpi-lbl"));
            var labelTexts = kpiLabels.Select(e => e.Text).ToList();
            Assert.Contains(labelTexts, t => t.Contains("Total Assigned",  StringComparison.OrdinalIgnoreCase));
            Assert.Contains(labelTexts, t => t.Contains("Open Tickets",    StringComparison.OrdinalIgnoreCase));
            Assert.Contains(labelTexts, t => t.Contains("In Progress",     StringComparison.OrdinalIgnoreCase));
            Assert.Contains(labelTexts, t => t.Contains("Resolved",        StringComparison.OrdinalIgnoreCase));

            // Verify priority breakdown panel exists
            wait.Until(d => d.FindElements(By.CssSelector(".tc-pri-row")).Count > 0);
            TakeScreenshot(driver, screenshotDir, "04_priority_breakdown.png");

            // ═══════════════════════════════════════════════════════
            // STEP 5 — Technician_ViewAssignedTickets
            // ═══════════════════════════════════════════════════════
            driver.Navigate().GoToUrl($"{baseUrl}/technician/tickets");
            WaitForSplashToDisappear(driver, wait);

            // Wait for either ticket cards or empty state to appear
            wait.Until(d =>
                d.FindElements(By.CssSelector(".ttl-card")).Count > 0 ||
                d.FindElements(By.CssSelector(".tc-empty-title")).Count > 0);

            TakeScreenshot(driver, screenshotDir, "05_assigned_tickets.png");

            // Verify page header
            var pageTitle = driver.FindElement(By.CssSelector(".tc-title")).Text;
            Assert.Contains("My Tickets", pageTitle, StringComparison.OrdinalIgnoreCase);

            // Verify filter bar is present
            wait.Until(d => d.FindElements(By.CssSelector(".tfl-bar")).Count > 0);

            // ═══════════════════════════════════════════════════════
            // STEP 6 — Technician_FilterTickets_ByStatus
            // ═══════════════════════════════════════════════════════
            var statusFilter = wait.Until(d =>
            {
                var el = d.FindElement(By.Id("tfl-status"));
                return el.Displayed ? el : null;
            })!;

            // ── Filter by "open" ───────────────────────────────────
            new SelectElement(statusFilter).SelectByText("open");
            WaitForListToStabilize(driver, wait);
            TakeScreenshot(driver, screenshotDir, "06_filter_open.png");

            // Re-find the filter element (DOM may have re-rendered)
            statusFilter = wait.Until(d =>
            {
                var el = d.FindElement(By.Id("tfl-status"));
                return el.Displayed ? el : null;
            })!;

            // ── Filter by "in progress" ────────────────────────────
            new SelectElement(statusFilter).SelectByText("in progress");
            WaitForListToStabilize(driver, wait);
            TakeScreenshot(driver, screenshotDir, "06_filter_in_progress.png");

            // Re-find the filter element again
            statusFilter = wait.Until(d =>
            {
                var el = d.FindElement(By.Id("tfl-status"));
                return el.Displayed ? el : null;
            })!;

            // ── Reset to All ───────────────────────────────────────
            new SelectElement(statusFilter).SelectByText("All Statuses");
            WaitForListToStabilize(driver, wait);
            TakeScreenshot(driver, screenshotDir, "06_filter_reset.png");

            // ═══════════════════════════════════════════════════════
            // STEP 7 — Technician_ViewTicketDetail
            // ═══════════════════════════════════════════════════════

            // Ensure filter is truly reset — navigate fresh to avoid stale DOM
            driver.Navigate().GoToUrl($"{baseUrl}/technician/tickets");
            WaitForSplashToDisappear(driver, wait);

            // Wait for cards to fully render
            wait.Until(d =>
                d.FindElements(By.CssSelector(".ttl-card")).Count > 0 ||
                d.FindElements(By.CssSelector(".tc-empty-title")).Count > 0);

            Thread.Sleep(1000); // let React settle

            var ticketCards = driver.FindElements(By.CssSelector(".ttl-card"));
            if (ticketCards.Count == 0)
            {
                TakeScreenshot(driver, screenshotDir, "07_no_tickets_to_click.png");
                Assert.Fail("No tickets assigned to this technician. Assign a ticket first (Part 1).");
            }

            // Scroll the first card into view and click via JS to avoid interception
            var firstCard = ticketCards[0];
            ((IJavaScriptExecutor)driver).ExecuteScript(
                "arguments[0].scrollIntoView({block:'center'});", firstCard);
            Thread.Sleep(500);

            TakeScreenshot(driver, screenshotDir, "07_before_click.png");

            // Use JS click — more reliable than native click
            ((IJavaScriptExecutor)driver).ExecuteScript("arguments[0].click();", firstCard);

            // Wait for URL to change to detail page (contains ticket ID int)
            wait.Until(d =>
            {
                var url = d.Url;
                // Must match pattern /technician/tickets/{number}
                var match = System.Text.RegularExpressions.Regex.IsMatch(
                    url, @"/technician/tickets/\d+", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                return match;
            });
            WaitForSplashToDisappear(driver, wait);

            // Wait for "Ticket Info" panel to appear
            wait.Until(d =>
            {
                try
                {
                    return d.FindElements(By.XPath(
                        "//span[contains(@class,'tc-panel-title') and normalize-space(text())='Ticket Info']"
                    )).Count > 0;
                }
                catch (StaleElementReferenceException) { return false; }
            });

            TakeScreenshot(driver, screenshotDir, "07_ticket_detail.png");

            // Verify title format "Ticket #xxx"
            var detailTitle = wait.Until(d =>
            {
                try
                {
                    var el = d.FindElement(By.CssSelector(".tc-title"));
                    return el.Displayed ? el.Text : null;
                }
                catch (StaleElementReferenceException) { return null; }
            })!;
            Assert.Contains("Ticket #", detailTitle, StringComparison.OrdinalIgnoreCase);

            // Verify key panels exist
            var panelTitles = wait.Until(d =>
            {
                try
                {
                    var panels = d.FindElements(By.CssSelector(".tc-panel-title"));
                    return panels.Count > 0 ? panels.Select(e => e.Text).ToList() : null;
                }
                catch (StaleElementReferenceException) { return null; }
            })!;

            Assert.Contains(panelTitles, t => t.Contains("Ticket Info"));
            Assert.Contains(panelTitles, t => t.Contains("Update Status"));
            Assert.Contains(panelTitles, t => t.Contains("Update Asset Condition"));

            TakeScreenshot(driver, screenshotDir, "07_panels_verified.png");
        }
        catch
        {
            TryTakeScreenshot(driver, screenshotDir, "99_failure.png");
            throw;
        }
    }

    // ════════════════════════════════════════════════════════════════
    // Helpers
    // ════════════════════════════════════════════════════════════════

    /// <summary>
    /// Waits for the ticket list to stabilize after a filter change.
    /// Replaces Thread.Sleep — waits until cards OR empty state appears.
    /// </summary>
    private static void WaitForListToStabilize(IWebDriver driver, WebDriverWait wait)
    {
        wait.Until(d =>
        {
            try
            {
                return
                    d.FindElements(By.CssSelector(".ttl-card")).Count > 0 ||
                    d.FindElements(By.CssSelector(".tc-empty-title")).Count > 0;
            }
            catch (StaleElementReferenceException) { return false; }
        });
    }

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
            catch (NoSuchElementException)          { return true; }
            catch (StaleElementReferenceException)  { return true; }
        });
    }

    private static string GetEnvOrDefault(string key, string fallback)
        => Environment.GetEnvironmentVariable(key) ?? fallback;

    private static string GetScreenshotDir()
    {
        var repoRoot = FindRepoRoot();
        var dir = Path.Combine(repoRoot, "tests", "selenium_tests", "screenshots", "part2_technician_view");
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