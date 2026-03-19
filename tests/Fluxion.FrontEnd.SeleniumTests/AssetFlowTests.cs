using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using System.Linq;
using Xunit;
using Xunit.Abstractions;

namespace Fluxion.FrontEnd.SeleniumTests;

[Collection("Selenium")]
public sealed class AssetFlowTests
{
    private readonly SeleniumFixture _fixture;
    private readonly ITestOutputHelper _output;

    public AssetFlowTests(SeleniumFixture fixture, ITestOutputHelper output)
    {
        _fixture = fixture;
        _output = output;
    }

    private void LogStep(string message)
    {
        _output.WriteLine($"[{DateTime.UtcNow:HH:mm:ss}] {message}");
    }

    private void RunTest(string testName, Action action)
    {
        LogStep($"START: {testName}");
        var status = "PASSED";
        try
        {
            action();
        }
        catch (Exception ex)
        {
            status = "FAILED";
            LogStep($"ERROR: {ex.GetType().Name} - {ex.Message}");
            throw;
        }
        finally
        {
            var screenshotPath = _fixture.CaptureScreenshot(testName, status);
            if (!string.IsNullOrWhiteSpace(screenshotPath))
            {
                LogStep($"SCREENSHOT: {screenshotPath}");
            }
            LogStep($"RESULT: {testName} => {status}");
        }
    }

    [Fact]
    public void RegisterAssetFlowShowsSuccessCard()
    {
        RunTest(nameof(RegisterAssetFlowShowsSuccessCard), () =>
        {
            LogStep("Ensure authenticated session");
            _fixture.EnsureLoggedIn();

            LogStep("Navigate to Register Asset");
            _fixture.NavigateSidebar("Register Asset", "/register-asset");

            LogStep("Wait for asset form");
            _fixture.WaitUntilVisible(By.Id("asset-name"));

            var deptSelectElement = new SelectElement(_fixture.WaitUntilVisible(By.Id("asset-dept")));
            _fixture.Wait.Until(_ => deptSelectElement.Options.Count > 1);
            var firstDept = deptSelectElement.Options.FirstOrDefault(option => !string.IsNullOrWhiteSpace(option.GetAttribute("value")));
            Assert.NotNull(firstDept);
            deptSelectElement.SelectByValue(firstDept!.GetAttribute("value"));

            var uniqueName = $"Selenium Asset {DateTime.UtcNow:yyyyMMddHHmmss}";
            LogStep($"Register asset: {uniqueName}");

            var nameInput = _fixture.Driver.FindElement(By.Id("asset-name"));
            nameInput.Clear();
            nameInput.SendKeys(uniqueName);

            var typeSelect = new SelectElement(_fixture.Driver.FindElement(By.Id("asset-type")));
            typeSelect.SelectByText("Laptop");

            var serialInput = _fixture.Driver.FindElement(By.Id("asset-serial"));
            serialInput.Clear();
            serialInput.SendKeys($"SN-{DateTime.UtcNow:HHmmss}");

            var costInput = _fixture.Driver.FindElement(By.Id("asset-cost"));
            costInput.Clear();
            costInput.SendKeys("1250.50");

            _fixture.Driver.FindElement(By.CssSelector("button.rap-btn-submit")).Click();

            LogStep("Wait for success card");
            var successTitle = _fixture.WaitUntilVisible(By.CssSelector(".rap-success-title"));
            Assert.Contains(uniqueName, successTitle.Text, StringComparison.OrdinalIgnoreCase);
        });
    }

    [Fact]
    public void AllAssetsPageDisplaysInventory()
    {
        RunTest(nameof(AllAssetsPageDisplaysInventory), () =>
        {
            LogStep("Ensure authenticated session");
            _fixture.EnsureLoggedIn();

            LogStep("Navigate to All Assets");
            _fixture.NavigateSidebar("All Assets", "/assets");

            var title = _fixture.WaitUntilVisible(By.CssSelector(".aa-title"));
            Assert.Equal("All Assets", title.Text.Trim());

            _fixture.Wait.Until(driver =>
            {
                var loadingVisible = driver.FindElements(By.CssSelector(".aa-loading"))
                    .Any(el => el.Displayed);
                if (loadingVisible)
                {
                    return false;
                }

                var hasTable = driver.FindElements(By.CssSelector(".aa-table")).Any();
                var hasEmpty = driver.FindElements(By.CssSelector(".aa-empty")).Any();
                return hasTable || hasEmpty;
            });

            _fixture.WaitUntilVisible(By.CssSelector(".aa-stats-row"));
            _fixture.WaitUntilVisible(By.CssSelector(".aa-panel"));
        });
    }
}
