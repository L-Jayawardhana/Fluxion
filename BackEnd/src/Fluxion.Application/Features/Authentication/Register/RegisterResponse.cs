namespace Fluxion.Application.Features.Authentication.Register;

public record RegisterResponse(
    int UserId,
    string FullName,
    string Email,
    string Role
);
