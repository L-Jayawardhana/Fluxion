namespace Fluxion.Application.Features.Authentication.Login;

public record LoginResponse(
    string Token,
    int UserId,
    string FullName,
    string Email,
    string Role,
    bool MustChangePassword,
    long ExpiresAt
);
