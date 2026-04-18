using FluentAssertions;
using Fluxion.Application.Features.Users.CreateEmployee;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using Fluxion.UnitTests.Builders;
using Fluxion.UnitTests.Helpers;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace Fluxion.UnitTests.Users;

public class CreateEmployeeCommandHandlerTests : IDisposable
{
    private readonly Persistence.Context.FluxionDbContext _dbContext;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<IInvitationService> _invitationServiceMock;
    private readonly Mock<ICurrentUserService> _currentUserServiceMock;
    private readonly CreateEmployeeCommandHandler _handler;

    public CreateEmployeeCommandHandlerTests()
    {
        _dbContext = InMemoryDbContextFactory.Create();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _passwordHasherMock.Setup(p => p.Hash(It.IsAny<string>())).Returns("hashed_password");
        _invitationServiceMock = new Mock<IInvitationService>();
        _currentUserServiceMock = new Mock<ICurrentUserService>();

        // Default: Owner is the one inviting
        _currentUserServiceMock.Setup(u => u.Role).Returns("owner");

        _handler = new CreateEmployeeCommandHandler(
            _dbContext,
            _passwordHasherMock.Object,
            _invitationServiceMock.Object,
            _currentUserServiceMock.Object);
            
        // Setup initial org
        _dbContext.Organizations.Add(new Organization { OrgId = 1, OrgName = "Test Org" });
        _dbContext.Departments.Add(new Department { DepartmentId = 1, OrgId = 1, DepartmentName = "Test Dept", IsActive = true });
        _dbContext.SaveChanges();
    }

    [Fact]
    public async Task Handle_TechnicianRole_NoDepartmentRequired()
    {
        // Arrange
        var command = new CreateEmployeeCommand(
            "Tech", "One", "tech@fluxion.dev", "Password123!", 1, null, "technician");

        _invitationServiceMock.Setup(i => i.GenerateInvitationToken()).Returns("token");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        var user = _dbContext.Users.Include(u => u.UserDepartments).First(u => u.Email == "tech@fluxion.dev");
        user.Role.Should().Be(UserRole.technician);
        user.UserDepartments.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_ManagerRole_NoDepartmentRequired()
    {
        // Arrange
        var command = new CreateEmployeeCommand(
            "Mgr", "One", "mgr@fluxion.dev", "Password123!", 1, null, "manager");

        _invitationServiceMock.Setup(i => i.GenerateInvitationToken()).Returns("token");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        var user = _dbContext.Users.Include(u => u.UserDepartments).First(u => u.Email == "mgr@fluxion.dev");
        user.Role.Should().Be(UserRole.manager);
        user.UserDepartments.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_UserRole_RequiresDepartment()
    {
        // Arrange
        var command = new CreateEmployeeCommand(
            "User", "One", "user@fluxion.dev", "Password123!", 1, null, "user");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Department is required for this role.");
    }

    [Fact]
    public async Task Handle_UserRole_WithValidDepartment_SavesAssociation()
    {
        // Arrange
        var command = new CreateEmployeeCommand(
            "User", "Two", "user2@fluxion.dev", "Password123!", 1, 1, "user");
            
        _invitationServiceMock.Setup(i => i.GenerateInvitationToken()).Returns("token");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        var user = _dbContext.Users.Include(u => u.UserDepartments).First(u => u.Email == "user2@fluxion.dev");
        user.UserDepartments.Should().HaveCount(1);
        user.UserDepartments.First().DepartmentId.Should().Be(1);
    }

    [Fact]
    public async Task Handle_NonOwnerOrAdmin_CannotInviteManager()
    {
        // Arrange
        _currentUserServiceMock.Setup(u => u.Role).Returns("user");
        var command = new CreateEmployeeCommand(
            "Mgr", "Two", "mgr2@fluxion.dev", "Password123!", 1, null, "manager");

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Only owners or admins can add managers or other administrators.");
    }

    public void Dispose()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
    }
}
