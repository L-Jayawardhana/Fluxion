namespace Fluxion.Application.Features.Authentication.RegisterSystemAdmin;

public record RegisterSystemAdminResponse(
    int UserId,
    string FullName,
    string Email,
    string Role,
    string Token
);
