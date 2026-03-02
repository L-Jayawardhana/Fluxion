using Fluxion.Domain.Entities;

namespace Fluxion.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(User user, bool rememberMe = false);
    long GetTokenExpiryUnixSeconds(bool rememberMe = false);
}
