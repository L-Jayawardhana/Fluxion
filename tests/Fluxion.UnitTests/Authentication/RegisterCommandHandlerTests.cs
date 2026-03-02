using FluentAssertions;
using Fluxion.Application.Features.Authentication.Register;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Fluxion.UnitTests.Builders;
using Fluxion.UnitTests.Helpers;
using Moq;

namespace Fluxion.UnitTests.Authentication;

public class RegisterCommandHandlerTests : IDisposable
{
    private readonly Persistence.Context.FluxionDbContext _dbContext;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<IJwtTokenService> _jwtTokenServiceMock;
    private readonly RegisterCommandHandler _handler;

    public RegisterCommandHandlerTests()
    {
        _dbContext = InMemoryDbContextFactory.Create();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _jwtTokenServiceMock = new Mock<IJwtTokenService>();

        _handler = new RegisterCommandHandler(
            _dbContext,
            _passwordHasherMock.Object,
            _jwtTokenServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ValidNewUser_CreatesUserAndReturnsToken()
    {
        _passwordHasherMock.Setup(p => p.Hash("StrongP@ss1")).Returns("hashed-value");
        _jwtTokenServiceMock.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("new-jwt-token");

        var command = new RegisterCommand("Jane Doe", "jane@fluxion.dev", "StrongP@ss1", null);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().NotBeNull();
        result.Token.Should().Be("new-jwt-token");
        result.Email.Should().Be("jane@fluxion.dev");
        result.FullName.Should().Be("Jane Doe");
        result.Role.Should().Be("user");

        var savedUser = _dbContext.Users.FirstOrDefault(u => u.Email == "jane@fluxion.dev");
        savedUser.Should().NotBeNull();
        savedUser!.PasswordHash.Should().Be("hashed-value");
        savedUser.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_DuplicateEmail_ThrowsInvalidOperation()
    {
        var existing = new UserBuilder().WithEmail("dup@fluxion.dev").Build();
        _dbContext.Users.Add(existing);
        await _dbContext.SaveChangesAsync();

        _passwordHasherMock.Setup(p => p.Hash(It.IsAny<string>())).Returns("h");

        var command = new RegisterCommand("Duplicate", "dup@fluxion.dev", "StrongP@ss1", null);

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("A user with this email already exists.");
    }

    [Fact]
    public async Task Handle_WithValidOrgId_SetsOrgId()
    {
        // Seed an organization
        _dbContext.Organizations.Add(new Organization
        {
            OrgId = 1,
            OrgName = "Test Org",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _dbContext.SaveChangesAsync();

        _passwordHasherMock.Setup(p => p.Hash(It.IsAny<string>())).Returns("h");
        _jwtTokenServiceMock.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("tok");

        var command = new RegisterCommand("Org User", "org@fluxion.dev", "StrongP@ss1", 1);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Should().NotBeNull();
        var user = _dbContext.Users.First(u => u.Email == "org@fluxion.dev");
        user.OrgId.Should().Be(1);
    }

    [Fact]
    public async Task Handle_WithNonExistentOrgId_ThrowsInvalidOperation()
    {
        _passwordHasherMock.Setup(p => p.Hash(It.IsAny<string>())).Returns("h");

        var command = new RegisterCommand("Bad Org", "bad@fluxion.dev", "StrongP@ss1", 999);

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("The specified organization does not exist.");
    }

    [Fact]
    public async Task Handle_NewUser_IsAssignedUserRole()
    {
        _passwordHasherMock.Setup(p => p.Hash(It.IsAny<string>())).Returns("h");
        _jwtTokenServiceMock.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("tok");

        var command = new RegisterCommand("Role User", "role@fluxion.dev", "StrongP@ss1", null);

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Role.Should().Be("user");
    }

    [Fact]
    public async Task Handle_NewUser_PasswordIsHashed()
    {
        _passwordHasherMock.Setup(p => p.Hash("MyP@ssw0rd")).Returns("bcrypt-hashed-result");
        _jwtTokenServiceMock.Setup(j => j.GenerateToken(It.IsAny<User>())).Returns("tok");

        var command = new RegisterCommand("Hash User", "hash@fluxion.dev", "MyP@ssw0rd", null);

        await _handler.Handle(command, CancellationToken.None);

        var user = _dbContext.Users.First(u => u.Email == "hash@fluxion.dev");
        user.PasswordHash.Should().Be("bcrypt-hashed-result");
        _passwordHasherMock.Verify(p => p.Hash("MyP@ssw0rd"), Times.Once);
    }

    public void Dispose()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
    }
}
