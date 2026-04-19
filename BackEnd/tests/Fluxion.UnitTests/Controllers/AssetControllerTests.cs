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
    // ── Class-level authorization ────────────────────────────────────

    [Fact]
    public void AssetController_ShouldHaveAuthorizeAttribute()
    {
        typeof(AssetController).Should().BeDecoratedWith<AuthorizeAttribute>();
    }

    // ── GetAll ───────────────────────────────────────────────────────

    [Fact]
    public void GetAll_ShouldBeRestrictedToManagementRoles()
    {
        var method = typeof(AssetController).GetMethod(nameof(AssetController.GetAll));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("GetAll should have role restrictions");
        attr!.Roles.Should().Contain("owner");
        attr.Roles.Should().Contain("admin");
    }

    // ── Create ───────────────────────────────────────────────────────

    [Fact]
    public void Create_ShouldBeRestrictedToManagementRoles()
    {
        var method = typeof(AssetController).GetMethod(nameof(AssetController.Create));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("Create should have role restrictions");
        attr!.Roles.Should().Contain("owner");
        attr.Roles.Should().Contain("admin");
    }

    // ── Assign ───────────────────────────────────────────────────────

    [Fact]
    public void Assign_ShouldRequireAuthorization()
    {
        var method = typeof(AssetController).GetMethod(nameof(AssetController.Assign));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("Assign should have role restrictions");
        attr!.Roles.Should().Contain("admin");
        attr.Roles.Should().Contain("owner");
    }

    // ── Unassign ─────────────────────────────────────────────────────

    [Fact]
    public void Unassign_ShouldRequireAuthorization()
    {
        var method = typeof(AssetController).GetMethod(nameof(AssetController.Unassign));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("Unassign should have role restrictions");
        attr!.Roles.Should().Contain("admin");
        attr.Roles.Should().Contain("owner");
    }

    // ── Transfer ─────────────────────────────────────────────────────

    [Fact]
    public void Transfer_ShouldRequireAuthorization()
    {
        var method = typeof(AssetController).GetMethod(nameof(AssetController.Transfer));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("Transfer should have role restrictions");
        attr!.Roles.Should().Contain("admin");
        attr.Roles.Should().Contain("owner");
    }

    // ── Retire ───────────────────────────────────────────────────────

    [Fact]
    public void Retire_ShouldRequireAuthorization()
    {
        var method = typeof(AssetController).GetMethod(nameof(AssetController.Retire));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("Retire should have role restrictions");
        attr!.Roles.Should().Contain("admin");
        attr.Roles.Should().Contain("owner");
    }

    // ── GetWarrantyExpiryReport ──────────────────────────────────────

    [Fact]
    public void GetWarrantyExpiryReport_ShouldBeRestrictedToManagementRoles()
    {
        var method = typeof(AssetController).GetMethod(nameof(AssetController.GetWarrantyExpiryReport));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("GetWarrantyExpiryReport should have role restrictions");
        attr!.Roles.Should().Contain("owner");
        attr.Roles.Should().Contain("admin");
    }

    // ── SEC-04: Debug code in production ─────────────────────────────

    [Fact]
    public void Endpoints_ShouldNotContainDebugOnlyComments()
    {
        // SEC-04: AssetController has "Debugging ONLY" comments with stack trace exposure.
        // This is a static analysis test to detect debug code left in production.
        var sourceFile = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "..", "..", "..", "..", "..", "src", "Fluxion.API", "Controllers", "AssetController.cs"
        );

        if (File.Exists(sourceFile))
        {
            var content = File.ReadAllText(sourceFile);
            var hasDebugExposure = content.Contains("Debugging ONLY");
            hasDebugExposure.Should().BeFalse(
                "SEC-04: AssetController should NOT contain debug-only stack trace exposure in production code");
        }
    }
}
