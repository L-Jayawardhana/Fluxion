using Fluxion.Domain.Entities;

namespace Fluxion.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(User user);
}
