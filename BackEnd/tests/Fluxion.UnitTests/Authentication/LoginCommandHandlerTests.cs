using FluentAssertions;
using Fluxion.Application.Features.Authentication.Login;
using Fluxion.Application.Interfaces;
using Fluxion.UnitTests.Builders;
using Fluxion.UnitTests.Helpers;
using Moq;

namespace Fluxion.UnitTests.Authentication;

public class LoginCommandHandlerTests : IDisposable
{
    private readonly Persistence.Context.FluxionDbContext _dbContext;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<IJwtTokenService> _jwtTokenServiceMock;
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _dbContext = InMemoryDbContextFactory.Create();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _jwtTokenServiceMock = new Mock<IJwtTokenService>();

        _handler = new LoginCommandHandler(
            _dbContext,
            _passwordHasherMock.Object,
            _jwtTokenServiceMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCredentials_ReturnsTokenAndUserInfo()
    {
        // Arrange
        var user = new UserBuilder()
            .WithEmail("john@fluxion.dev")
            .WithFullName("John Doe")
            .WithPasswordHash("hashed-password")
            .Build();
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        _passwordHasherMock.Setup(p => p.Verify("correct-password", "hashed-password")).Returns(true);
        _jwtTokenServiceMock.Setup(j => j.GenerateToken(It.IsAny<Domain.Entities.User>(), It.IsAny<bool>())).Returns("jwt-token-123");

        var command = new LoginCommand("john@fluxion.dev", "correct-password");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Token.Should().Be("jwt-token-123");
        result.Email.Should().Be("john@fluxion.dev");
        result.FullName.Should().Be("John Doe");
        result.Role.Should().Be("user");
    }

    [Fact]
    public async Task Handle_NonExistentEmail_ThrowsUnauthorized()
    {
        var command = new LoginCommand("nobody@fluxion.dev", "any-password");

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Invalid email or password.");
    }

    [Fact]
    public async Task Handle_WrongPassword_ThrowsUnauthorized()
    {
        var user = new UserBuilder().WithEmail("john@fluxion.dev").WithPasswordHash("hashed").Build();
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        _passwordHasherMock.Setup(p => p.Verify("wrong-password", "hashed")).Returns(false);

        var command = new LoginCommand("john@fluxion.dev", "wrong-password");

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Invalid email or password.");
    }

    [Fact]
    public async Task Handle_DeactivatedUser_ThrowsUnauthorized()
    {
        var user = new UserBuilder().WithEmail("locked@fluxion.dev").AsDeactivated().Build();
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        var command = new LoginCommand("locked@fluxion.dev", "any");

        var act = () => _handler.Handle(command, CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("Account is deactivated.");
    }

    [Fact]
    public async Task Handle_SuccessfulLogin_UpdatesLastLoginAt()
    {
        var user = new UserBuilder().WithEmail("john@fluxion.dev").WithPasswordHash("h").Build();
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        _passwordHasherMock.Setup(p => p.Verify(It.IsAny<string>(), "h")).Returns(true);
        _jwtTokenServiceMock.Setup(j => j.GenerateToken(It.IsAny<Domain.Entities.User>(), It.IsAny<bool>())).Returns("tok");

        var before = DateTime.UtcNow;
        await _handler.Handle(new LoginCommand("john@fluxion.dev", "pass"), CancellationToken.None);

        var updated = _dbContext.Users.First(u => u.Email == "john@fluxion.dev");
        updated.LastLoginAt.Should().NotBeNull();
        updated.LastLoginAt!.Value.Should().BeOnOrAfter(before);
    }

    [Fact]
    public async Task Handle_UserWithMustChangePassword_ReturnsTrueFlag()
    {
        var user = new UserBuilder()
            .WithEmail("new@fluxion.dev")
            .WithPasswordHash("h")
            .WithMustChangePassword(true)
            .Build();
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        _passwordHasherMock.Setup(p => p.Verify(It.IsAny<string>(), "h")).Returns(true);
        _jwtTokenServiceMock.Setup(j => j.GenerateToken(It.IsAny<Domain.Entities.User>(), It.IsAny<bool>())).Returns("tok");

        var result = await _handler.Handle(new LoginCommand("new@fluxion.dev", "pass"), CancellationToken.None);

        result.MustChangePassword.Should().BeTrue();
    }

    public void Dispose()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
    }
}
