using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Fluxion.Application.Interfaces;
using Fluxion.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Fluxion.Infrastructure.JWT;

public class JwtTokenService : IJwtTokenService
{
    private readonly JwtSettings _settings;

    public JwtTokenService(IOptions<JwtSettings> settings)
    {
        _settings = settings.Value;
    }

    public long GetTokenExpiryUnixSeconds(bool rememberMe = false)
    {
        var minutes = rememberMe ? _settings.RememberMeExpiryMinutes : _settings.ExpiryMinutes;
        return new DateTimeOffset(DateTime.UtcNow.AddMinutes(minutes)).ToUnixTimeSeconds();
    }

    public string GenerateToken(User user, bool rememberMe = false)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiryMinutes = rememberMe ? _settings.RememberMeExpiryMinutes : _settings.ExpiryMinutes;
        var email = user.Email ?? string.Empty;
        var orgId = user.OrgId?.ToString() ?? string.Empty;

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("OrgId", orgId),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
