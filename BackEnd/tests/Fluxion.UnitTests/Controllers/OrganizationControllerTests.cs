using FluentAssertions;
using Fluxion.API.Controllers;
using Fluxion.Application.Features.Organizations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Reflection;

namespace Fluxion.UnitTests.Controllers;

/// <summary>
/// Unit tests for OrganizationController.
/// Validates authorization attributes and basic endpoint behavior.
/// </summary>
public class OrganizationControllerTests
{
    private readonly Mock<IMediator> _mediator = new();

    private OrganizationController CreateController() => new(_mediator.Object, null!);

    // ── Authorization attribute tests ────────────────────────────────

    [Fact]
    public void OrganizationController_ShouldHaveAuthorizeAttribute()
    {
        typeof(OrganizationController).Should().BeDecoratedWith<AuthorizeAttribute>();
    }

    [Fact]
    public void GetAll_ShouldBeRestrictedToAdminRoles()
    {
        var method = typeof(OrganizationController).GetMethod(nameof(OrganizationController.GetAll));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull();
        attr!.Roles.Should().Be("owner,systemAdmin,admin,manager");
    }

    [Fact]
    public void Create_ShouldBeRestrictedToOwnerAndSystemAdmin()
    {
        var method = typeof(OrganizationController).GetMethod(nameof(OrganizationController.Create));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull();
        attr!.Roles.Should().Be("owner,systemAdmin");
    }

    [Fact]
    public void UpdatePlan_ShouldBeRestrictedToOwnerSystemAdminAndAdmin()
    {
        var method = typeof(OrganizationController).GetMethod(nameof(OrganizationController.UpdatePlan));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull();
        attr!.Roles.Should().Be("owner,systemAdmin,admin");
    }

    [Fact]
    public void GetPlan_ShouldBeRestrictedToManagementRoles()
    {
        var method = typeof(OrganizationController).GetMethod(nameof(OrganizationController.GetPlan));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("GetPlan should require authorization");
        attr!.Roles.Should().Be("owner,systemAdmin,admin,manager");
    }

    [Fact]
    public void UploadLogo_ShouldBeRestrictedToOwnerSystemAdminAndAdmin()
    {
        var method = typeof(OrganizationController).GetMethod(nameof(OrganizationController.UploadLogo));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("UploadLogo should require authorization");
        attr!.Roles.Should().Be("owner,systemAdmin,admin");
    }

    [Fact]
    public void Update_ShouldBeRestrictedToOwnerSystemAdminAndAdmin()
    {
        var method = typeof(OrganizationController).GetMethod(nameof(OrganizationController.Update));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("Update should require authorization");
        attr!.Roles.Should().Be("owner,systemAdmin,admin");
    }

    [Fact]
    public void Delete_ShouldBeRestrictedToOwnerSystemAdminAndAdmin()
    {
        var method = typeof(OrganizationController).GetMethod(nameof(OrganizationController.Delete));

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull("Delete should require authorization");
        attr!.Roles.Should().Be("owner,systemAdmin,admin");
    }

    // ── Endpoint behavior tests ─────────────────────────────────────

    [Fact]
    public async Task GetPlan_ValidId_ReturnsOkWithPlanName()
    {
        _mediator
            .Setup(m => m.Send(It.IsAny<GetOrganizationPlanQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Pro");

        var controller = CreateController();
        var result = await controller.GetPlan(1);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdatePlan_InvalidOperation_ReturnsBadRequest()
    {
        _mediator
            .Setup(m => m.Send(It.IsAny<UpdateOrganizationPlanCommand>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Plan not found"));

        var controller = CreateController();
        var result = await controller.UpdatePlan(1, new UpdatePlanDto { PlanName = "invalid" });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Create_DuplicateOrg_ReturnsConflict()
    {
        _mediator
            .Setup(m => m.Send(It.IsAny<CreateOrganizationCommand>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Organization already exists"));

        var controller = CreateController();
        var result = await controller.Create(new CreateOrganizationCommand("TestOrg", "test-org", "UTC", 1));

        result.Should().BeOfType<ConflictObjectResult>();
    }

    [Fact]
    public async Task Update_IdMismatch_ReturnsBadRequest()
    {
        var controller = CreateController();
        var command = new UpdateOrganizationCommand(99, "TestOrg", "test-org", "UTC", true);

        var result = await controller.Update(1, command);

        result.Should().BeOfType<BadRequestObjectResult>();
    }
}
