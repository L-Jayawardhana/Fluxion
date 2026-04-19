using FluentAssertions;
using Fluxion.API.Controllers;
using Fluxion.Application.Features.Organizations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Reflection;

namespace Fluxion.UnitTests.Controllers;

public class OrganizationControllerTests
{
    private readonly Mock<IMediator> _mediator = new();

    private OrganizationController CreateController() => new(_mediator.Object, null);

    [Fact]
    public void OrganizationController_ShouldHaveAuthorizeAttribute()
    {
        // Assert
        typeof(OrganizationController).Should().BeDecoratedWith<AuthorizeAttribute>();
    }

    [Fact]
    public void GetAll_ShouldBeRestrictedToAdminRoles()
    {
        // Arrange
        var method = typeof(OrganizationController).GetMethod(nameof(OrganizationController.GetAll));
        
        // Assert
        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull();
        attr.Roles.Should().Be("owner,systemAdmin,admin,manager");
    }

    [Fact]
    public void Create_ShouldBeRestrictedToOwnerAndSystemAdmin()
    {
        // Arrange
        var method = typeof(OrganizationController).GetMethod(nameof(OrganizationController.Create));
        
        // Assert
        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull();
        attr.Roles.Should().Be("owner,systemAdmin");
    }

    [Fact]
    public void UpdatePlan_ShouldBeRestrictedToOwnerSystemAdminAndAdmin()
    {
        // Arrange
        var method = typeof(OrganizationController).GetMethod(nameof(OrganizationController.UpdatePlan));
        
        // Assert
        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull();
        attr.Roles.Should().Be("owner,systemAdmin,admin");
    }
}
