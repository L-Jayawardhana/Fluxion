using MediatR;

namespace Fluxion.Application.Features.Authentication.Register;

public record RegisterCommand(
    string FullName,
    string Email,
    string Password,
    int? OrgId
) : IRequest<RegisterResponse>;
