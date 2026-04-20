using FluentAssertions;
using Fluxion.API.Controllers;
using Fluxion.Application.Features.Users;
using Fluxion.Application.Features.Users.AcceptInvite;
using Fluxion.Application.Features.Users.CreateEmployee;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Reflection;

namespace Fluxion.UnitTests.Controllers;

public class UserControllerTests
{
    private readonly Mock<IMediator> _mediator = new();

    private UserController CreateController() => new(_mediator.Object);

    [Fact]
    public void UserController_ShouldHaveAuthorizeAttribute()
    {
        // Assert
        typeof(UserController).Should().BeDecoratedWith<AuthorizeAttribute>();
    }

    [Fact]
    public void CreateEmployee_ShouldBeRestrictedToAdminRoles()
    {
        // Arrange
        var method = typeof(UserController).GetMethod(nameof(UserController.CreateEmployee))!;
        
        // Assert
        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull();
        attr!.Roles.Should().Be("owner,admin,manager");
    }

    [Fact]
    public void AcceptInvite_ShouldAllowAnonymous()
    {
        // Arrange
        var method = typeof(UserController).GetMethod(nameof(UserController.AcceptInvite))!;
        
        // Assert
        method.GetCustomAttribute<AllowAnonymousAttribute>().Should().NotBeNull();
    }

    [Fact]
    public void Delete_ShouldBeRestrictedToOwnerAndAdmin()
    {
        // Arrange
        var method = typeof(UserController).GetMethod(nameof(UserController.Delete))!;
        
        // Assert
        var attr = method.GetCustomAttribute<AuthorizeAttribute>();
        attr.Should().NotBeNull();
        attr!.Roles.Should().Be("owner,admin");
    }

    [Fact]
    public async Task GetAll_WhenValid_ReturnsOk()
    {
        // Arrange
        _mediator.Setup(m => m.Send(It.IsAny<GetAllUsersQuery>(), default))
                 .ReturnsAsync(new List<UserDto>());
        var controller = CreateController();

        // Act
        var result = await controller.GetAll(1);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }
}
