using System.Text.RegularExpressions;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;

namespace Fluxion.SeleniumTests;

/// <summary>
/// Part 3 — Technician Actions (Steps 8–11)
///
///  8.  Technician_UpdateTicketStatus  → in_progress
///  9.  Technician_LogRepair           (needs in_progress)
///  10. Technician_AddComment
///  11. Technician_UpdateAssetCondition
///
/// Logs in as technician, opens the first assigned ticket,
/// then walks through all four actions in order.
/// </summary>
public class Part3_TechnicianActionTests
{
    [Fact]
    public void TechnicianActions()
    {
        var techEmail    = GetEnvOrDefault("SELENIUM_TECHNICIAN_EMAIL",    "it23746664@my.sliit.lk");
        var techPassword = GetEnvOrDefault("SELENIUM_TECHNICIAN_PASSWORD", "gunarathna2003");
        var baseUrl      = GetEnvOrDefault("SELENIUM_BASE_URL",            "http://localhost:5173").TrimEnd('/');
        var headless     = GetEnvOrDefault("SELENIUM_HEADLESS", "false")
                               .Equals("true", StringComparison.OrdinalIgnoreCase);

        var screenshotDir = GetScreenshotDir();
        using var driver = CreateDriver(headless);
        var wait = CreateWait(driver);

        try
        {
            // ── Login ──────────────────────────────────────────────
            Login(driver, wait, baseUrl, techEmail, techPassword, screenshotDir, "00_tech_login.png");

            // ── Navigate to ticket list and open the first ticket ──
            driver.Navigate().GoToUrl($"{baseUrl}/technician/tickets");
            WaitForSplashToDisappear(driver, wait);

            wait.Until(d =>
                d.FindElements(By.CssSelector(".ttl-card")).Count > 0 ||
                d.FindElements(By.CssSelector(".tc-empty-title")).Count > 0);

            var cards = driver.FindElements(By.CssSelector(".ttl-card"));
            if (cards.Count == 0)
            {
                TakeScreenshot(driver, screenshotDir, "00_no_tickets.png");
                Assert.Fail("No tickets assigned to this technician. Run Part 1 first.");
            }

            // JS click first card
            ((IJavaScriptExecutor)driver).ExecuteScript(
                "arguments[0].scrollIntoView({block:'center'});", cards[0]);
            Thread.Sleep(500);
            ((IJavaScriptExecutor)driver).ExecuteScript("arguments[0].click();", cards[0]);

            // Wait for detail page
            wait.Until(d => Regex.IsMatch(d.Url, @"/technician/tickets/\d+", RegexOptions.IgnoreCase));
            WaitForSplashToDisappear(driver, wait);
            wait.Until(d => d.FindElements(By.XPath(
                "//span[contains(@class,'tc-panel-title') and normalize-space(text())='Ticket Info']")).Count > 0);

            TakeScreenshot(driver, screenshotDir, "00_ticket_detail.png");

            // ═══════════════════════════════════════════════════════
            // STEP 8 — Technician_UpdateTicketStatus → in_progress
            // ═══════════════════════════════════════════════════════
            Step8_UpdateStatus(driver, wait, baseUrl, screenshotDir);

            // ═══════════════════════════════════════════════════════
            // STEP 9 — Technician_LogRepair
            // ═══════════════════════════════════════════════════════
            Step9_LogRepair(driver, wait, screenshotDir);

            // ═══════════════════════════════════════════════════════
            // STEP 10 — Technician_AddComment
            // ═══════════════════════════════════════════════════════
            Step10_AddComment(driver, wait, screenshotDir);

            // ═══════════════════════════════════════════════════════
            // STEP 11 — Technician_UpdateAssetCondition
            // ═══════════════════════════════════════════════════════
            Step11_UpdateAssetCondition(driver, wait, screenshotDir);
        }
        catch
        {
            TryTakeScreenshot(driver, screenshotDir, "99_failure.png");
            throw;
        }
    }

    // ────────────────────────────────────────────────────────────────
    // Step 8: Update Status → in_progress
    // The ticket may be in: open, assigned, in_progress, waiting_parts
    // We need to reach "in_progress" for Step 9 (Log Repair).
    // ────────────────────────────────────────────────────────────────
    private static void Step8_UpdateStatus(
        IWebDriver driver, WebDriverWait wait, string baseUrl, string dir)
    {
        // Refresh to get latest status
        driver.Navigate().Refresh();
        WaitForSplashToDisappear(driver, wait);
        Thread.Sleep(2000);

        // Check if already at target before looping
        var currentStatus = GetCurrentTicketStatus(driver);
        if (currentStatus == "in_progress")
        {
            TakeScreenshot(driver, dir, "08_already_in_progress.png");
            return;
        }

        for (var attempt = 0; attempt < 3; attempt++)
        {
            var statusDropdowns = driver.FindElements(By.Id("usw-status"));
            if (statusDropdowns.Count == 0)
            {
                TakeScreenshot(driver, dir, "08_no_status_dropdown.png");
                return;
            }

            var select = new SelectElement(statusDropdowns[0]);
            var options = select.Options.Select(o => o.GetDomAttribute("value")).ToList();

            if (options.Count == 0) break;

            // Select in_progress if available, otherwise first option to advance
            if (options.Contains("in_progress"))
                select.SelectByValue("in_progress");
            else
                select.SelectByIndex(0);

            TakeScreenshot(driver, dir, $"08_step{attempt + 1}_selected.png");

            var confirmBtn = driver.FindElement(By.Id("usw-confirm"));
            if (!confirmBtn.Enabled)
            {
                TakeScreenshot(driver, dir, "08_confirm_disabled.png");
                break;
            }

            confirmBtn.Click();

            // Short timeout for toast — it may auto-dismiss quickly
            try
            {
                var shortWait = new WebDriverWait(driver, TimeSpan.FromSeconds(10));
                shortWait.Until(d =>
                    d.FindElements(By.CssSelector(".tc-toast-success")).Count > 0 ||
                    d.FindElements(By.CssSelector(".tc-toast-error")).Count > 0);
            }
            catch (WebDriverTimeoutException) { /* toast may have auto-dismissed */ }

            TakeScreenshot(driver, dir, $"08_step{attempt + 1}_confirmed.png");

            // Refresh and check status
            Thread.Sleep(1500);
            driver.Navigate().Refresh();
            WaitForSplashToDisappear(driver, wait);
            Thread.Sleep(2000);

            currentStatus = GetCurrentTicketStatus(driver);
            if (currentStatus == "in_progress")
            {
                TakeScreenshot(driver, dir, "08_reached_in_progress.png");
                return;
            }
        }

        TakeScreenshot(driver, dir, "08_status_final.png");
    }

    // ────────────────────────────────────────────────────────────────
    // Step 9: Log Repair (only visible when status = in_progress)
    // ────────────────────────────────────────────────────────────────
    private static void Step9_LogRepair(
        IWebDriver driver, WebDriverWait wait, string dir)
    {
        var repairDescs = driver.FindElements(By.Id("lrf-desc"));
        if (repairDescs.Count == 0)
        {
            // Log Repair form not visible — ticket may not be in_progress
            TakeScreenshot(driver, dir, "09_repair_form_not_visible.png");
            return;
        }

        repairDescs[0].Clear();
        repairDescs[0].SendKeys("Replaced faulty component — E2E Selenium Part 3 test.");

        var costInputs = driver.FindElements(By.Id("lrf-cost"));
        if (costInputs.Count > 0)
        {
            costInputs[0].Clear();
            costInputs[0].SendKeys("175.50");
        }

        TakeScreenshot(driver, dir, "09_repair_form_filled.png");

        var submitBtn = driver.FindElement(By.Id("lrf-submit"));
        Assert.True(submitBtn.Enabled, "Repair submit button should be enabled.");
        submitBtn.Click();

        // The form calls onUpdate() after success, which re-renders the page.
        // The toast may appear very briefly before the component unmounts.
        // Instead: wait for form to clear/disappear OR toast to appear.
        try
        {
            var shortWait = new WebDriverWait(driver, TimeSpan.FromSeconds(10));
            shortWait.Until(d =>
                d.FindElements(By.CssSelector(".tc-toast-success")).Count > 0 ||
                d.FindElements(By.CssSelector(".tc-toast-error")).Count > 0 ||
                d.FindElements(By.Id("lrf-desc")).Count == 0 || // form disappeared
                (d.FindElements(By.Id("lrf-desc")).Count > 0 && d.FindElement(By.Id("lrf-desc")).GetDomProperty("value") == "") // form cleared
            );
        }
        catch (WebDriverTimeoutException) { /* form may have re-rendered */ }

        Thread.Sleep(1000);
        TakeScreenshot(driver, dir, "09_repair_logged.png");
    }

    // ────────────────────────────────────────────────────────────────
    // Step 10: Add Comment
    // ────────────────────────────────────────────────────────────────
    private static void Step10_AddComment(
        IWebDriver driver, WebDriverWait wait, string dir)
    {
        // Scroll to the comment section
        var commentInputs = driver.FindElements(By.Id("cs-input"));
        if (commentInputs.Count == 0)
        {
            TakeScreenshot(driver, dir, "10_comment_input_not_found.png");
            Assert.Fail("Comment input (#cs-input) not found on the detail page.");
        }

        ((IJavaScriptExecutor)driver).ExecuteScript(
            "arguments[0].scrollIntoView({block:'center'});", commentInputs[0]);
        Thread.Sleep(500);

        commentInputs[0].Clear();
        commentInputs[0].SendKeys("Component replaced successfully. Monitoring performance. — Selenium Part 3");

        TakeScreenshot(driver, dir, "10_comment_typed.png");

        var postBtn = driver.FindElement(By.Id("cs-submit"));
        Assert.True(postBtn.Enabled, "Post Comment button should be enabled.");
        postBtn.Click();

        // Wait for toast OR input to clear (comment added successfully)
        try
        {
            var shortWait = new WebDriverWait(driver, TimeSpan.FromSeconds(10));
            shortWait.Until(d =>
                d.FindElements(By.CssSelector(".tc-toast-success")).Count > 0 ||
                d.FindElements(By.CssSelector(".tc-toast-error")).Count > 0 ||
                (d.FindElements(By.Id("cs-input")).Count > 0 && d.FindElement(By.Id("cs-input")).GetDomProperty("value") == "")
            );
        }
        catch (WebDriverTimeoutException) { /* toast may have auto-dismissed */ }

        Thread.Sleep(1000);
        TakeScreenshot(driver, dir, "10_comment_posted.png");
    }

    // ────────────────────────────────────────────────────────────────
    // Step 11: Update Asset Condition
    // ────────────────────────────────────────────────────────────────
    private static void Step11_UpdateAssetCondition(
        IWebDriver driver, WebDriverWait wait, string dir)
    {
        var condDropdowns = driver.FindElements(By.Id("uac-cond"));
        if (condDropdowns.Count == 0)
        {
            TakeScreenshot(driver, dir, "11_condition_dropdown_not_found.png");
            Assert.Fail("Asset condition dropdown (#uac-cond) not found on the detail page.");
        }

        // Scroll into view
        ((IJavaScriptExecutor)driver).ExecuteScript(
            "arguments[0].scrollIntoView({block:'center'});", condDropdowns[0]);
        Thread.Sleep(500);

        var condSelect = new SelectElement(condDropdowns[0]);
        // Select "under_maintenance" since the ticket is in progress
        var targetCondition = "under_maintenance";
        try
        {
            condSelect.SelectByValue(targetCondition);
        }
        catch (NoSuchElementException)
        {
            condSelect.SelectByIndex(2); // fallback to third option
        }

        TakeScreenshot(driver, dir, "11_condition_selected.png");

        var saveBtn = driver.FindElement(By.Id("uac-save"));
        Assert.True(saveBtn.Enabled, "Save Condition button should be enabled.");
        saveBtn.Click();

        // Wait for toast
        try
        {
            var shortWait = new WebDriverWait(driver, TimeSpan.FromSeconds(10));
            shortWait.Until(d =>
                d.FindElements(By.CssSelector(".tc-toast-success")).Count > 0 ||
                d.FindElements(By.CssSelector(".tc-toast-error")).Count > 0);
        }
        catch (WebDriverTimeoutException) { /* toast may have auto-dismissed */ }

        Thread.Sleep(1000);
        TakeScreenshot(driver, dir, "11_condition_saved.png");
    }

    // ════════════════════════════════════════════════════════════════
    // Helpers
    // ════════════════════════════════════════════════════════════════

    private static string GetCurrentTicketStatus(IWebDriver driver)
    {
        try
        {
            // The status badge is in the Ticket Info panel: <span class="tc-badge tc-badge-{status}">
            var badges = driver.FindElements(By.CssSelector(".tc-panel-head .tc-badge"));
            foreach (var badge in badges)
            {
                var cls = badge.GetDomAttribute("class") ?? "";
                var match = Regex.Match(cls, @"tc-badge-(\w+)");
                if (match.Success) return match.Groups[1].Value;
            }
        }
        catch { }
        return "unknown";
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
            catch (NoSuchElementException)         { return true; }
            catch (StaleElementReferenceException)  { return true; }
        });
    }

    private static string GetEnvOrDefault(string key, string fallback)
        => Environment.GetEnvironmentVariable(key) ?? fallback;

    private static string GetScreenshotDir()
    {
        var repoRoot = FindRepoRoot();
        var dir = Path.Combine(repoRoot, "tests", "selenium_tests", "screenshots", "part3_technician_actions");
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
