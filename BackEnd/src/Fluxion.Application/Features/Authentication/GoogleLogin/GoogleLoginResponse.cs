namespace Fluxion.Application.Features.Authentication.GoogleLogin;

public record GoogleLoginResponse(
    int UserId,
    string FullName,
    string Email,
    string Role,
    string Token,
    bool IsNewUser
);
