using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentAssertions;
using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;
using Fluxion.Infrastructure.JWT;
using Microsoft.Extensions.Options;

namespace Fluxion.UnitTests.Services;

public class JwtTokenServiceTests
{
    private readonly JwtSettings _settings = new()
    {
        SecretKey = "ThisIsATestSecretKeyThatIs256BitsLongForHmacSha256!!",
        Issuer = "FluxionTest",
        Audience = "FluxionTestUsers",
        ExpiryMinutes = 30
    };

    private readonly JwtTokenService _service;

    public JwtTokenServiceTests()
    {
        _service = new JwtTokenService(Options.Create(_settings));
    }

    [Fact]
    public void GenerateToken_ReturnsNonEmptyString()
    {
        var user = CreateTestUser();
        var token = _service.GenerateToken(user);
        token.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void GenerateToken_ContainsSubClaimWithUserId()
    {
        var user = CreateTestUser(userId: 42);
        var token = _service.GenerateToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == "42");
    }

    [Fact]
    public void GenerateToken_ContainsEmailClaim()
    {
        var user = CreateTestUser(email: "jwt@fluxion.dev");
        var token = _service.GenerateToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Email && c.Value == "jwt@fluxion.dev");
    }

    [Fact]
    public void GenerateToken_ContainsRoleClaim()
    {
        var user = CreateTestUser(role: UserRole.admin);
        var token = _service.GenerateToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == "admin");
    }

    [Fact]
    public void GenerateToken_ContainsJtiClaim()
    {
        var user = CreateTestUser();
        var token = _service.GenerateToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Jti);
        var jti = jwt.Claims.First(c => c.Type == JwtRegisteredClaimNames.Jti).Value;
        Guid.TryParse(jti, out _).Should().BeTrue("jti should be a valid GUID");
    }

    [Fact]
    public void GenerateToken_UsesHmacSha256()
    {
        var user = CreateTestUser();
        var token = _service.GenerateToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        jwt.Header.Alg.Should().Be("HS256");
    }

    [Fact]
    public void GenerateToken_SetsCorrectExpiry()
    {
        var user = CreateTestUser();
        var before = DateTime.UtcNow;
        var token = _service.GenerateToken(user);
        var after = DateTime.UtcNow;

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        jwt.ValidTo.Should().BeOnOrAfter(before.AddMinutes(_settings.ExpiryMinutes).AddSeconds(-1));
        jwt.ValidTo.Should().BeOnOrBefore(after.AddMinutes(_settings.ExpiryMinutes).AddSeconds(1));
    }

    [Fact]
    public void GenerateToken_SetsCorrectIssuerAndAudience()
    {
        var user = CreateTestUser();
        var token = _service.GenerateToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        jwt.Issuer.Should().Be("FluxionTest");
        jwt.Audiences.Should().Contain("FluxionTestUsers");
    }

    [Fact]
    public void GenerateToken_ContainsOrgIdClaim()
    {
        var user = CreateTestUser(orgId: 5);
        var token = _service.GenerateToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        jwt.Claims.Should().Contain(c => c.Type == "OrgId" && c.Value == "5");
    }

    [Fact]
    public void GenerateToken_TwoCalls_ProduceDifferentJti()
    {
        var user = CreateTestUser();
        var token1 = _service.GenerateToken(user);
        var token2 = _service.GenerateToken(user);

        var jwt1 = new JwtSecurityTokenHandler().ReadJwtToken(token1);
        var jwt2 = new JwtSecurityTokenHandler().ReadJwtToken(token2);

        var jti1 = jwt1.Claims.First(c => c.Type == JwtRegisteredClaimNames.Jti).Value;
        var jti2 = jwt2.Claims.First(c => c.Type == JwtRegisteredClaimNames.Jti).Value;

        jti1.Should().NotBe(jti2, "each token must have a unique jti");
    }

    private static User CreateTestUser(
        int userId = 1,
        string email = "test@fluxion.dev",
        UserRole role = UserRole.user,
        int? orgId = null) => new()
    {
        UserId = userId,
        OrgId = orgId,
        FullName = "Test User",
        Email = email,
        PasswordHash = "irrelevant",
        Role = role,
        IsActive = true,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };
}
