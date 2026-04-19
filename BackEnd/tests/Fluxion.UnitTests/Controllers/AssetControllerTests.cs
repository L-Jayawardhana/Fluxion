using FluentAssertions;
using Fluxion.API.Controllers;
using Microsoft.AspNetCore.Authorization;
using System.Reflection;

namespace Fluxion.UnitTests.Controllers;

/// <summary>
/// Unit tests for AssetController.
/// Validates authorization attributes and role restrictions on all endpoints.
/// </summary>
public class AssetControllerTests
{
    // ── Authorization attribute tests ────────────────────────────────

    [Fact]
    public void AssetController_ShouldHaveAuthorizeAttribute()
    {
        typeof(AssetController).Should().BeDecoratedWith<AuthorizeAttribute>();
    }

    [Fact]
    public void GetAll_ShouldBeRestrictedToManagementRoles()
    {
        var method = typeof(AssetController).GetMethod(nameof(AssetController.GetAll));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("GetAll should have role restrictions");
        attr!.Roles.Should().Contain("owner");
        attr.Roles.Should().Contain("admin");
    }

    [Fact]
    public void Create_ShouldBeRestrictedToManagementRoles()
    {
        var method = typeof(AssetController).GetMethod(nameof(AssetController.Create));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("Create should have role restrictions");
        attr!.Roles.Should().Contain("owner");
        attr.Roles.Should().Contain("admin");
    }

    [Fact]
    public void Delete_ShouldBeRestrictedToManagementRoles()
    {
        var method = typeof(AssetController).GetMethod(nameof(AssetController.Delete));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("Delete should have role restrictions");
        attr!.Roles.Should().Contain("owner");
    }

    [Fact]
    public void Assign_ShouldRequireAuthorization()
    {
        var method = typeof(AssetController).GetMethod(nameof(AssetController.Assign));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("Assign should have role restrictions");
    }

    [Fact]
    public void Unassign_ShouldRequireAuthorization()
    {
        var method = typeof(AssetController).GetMethod(nameof(AssetController.Unassign));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("Unassign should have role restrictions");
    }

    [Fact]
    public void Transfer_ShouldRequireAuthorization()
    {
        var method = typeof(AssetController).GetMethod(nameof(AssetController.Transfer));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("Transfer should have role restrictions");
    }

    [Fact]
    public void Retire_ShouldRequireAuthorization()
    {
        var method = typeof(AssetController).GetMethod(nameof(AssetController.Retire));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("Retire should have role restrictions");
    }

    // ── Verify debug code exposure (SEC-04) ─────────────────────────

    [Fact]
    public void Endpoints_ShouldNotReturnRawExceptionDetails_InProduction()
    {
        // This is a static analysis check — the actual controller currently
        // returns ex.Message + ex.InnerException in its catch blocks.
        // This test documents the known issue (SEC-04).
        // In production, exception details should be logged, not returned.

        var sourceFile = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "..", "..", "..", "..", "..", "src", "Fluxion.API", "Controllers", "AssetController.cs"
        );

        if (File.Exists(sourceFile))
        {
            var content = File.ReadAllText(sourceFile);
            // This SHOULD fail — documenting known bug SEC-04
            var hasDebugExposure = content.Contains("Debugging ONLY");
            hasDebugExposure.Should().BeFalse(
                    "SEC-04: AssetController should NOT contain debug-only stack trace exposure in production code");
        }
    }
}
