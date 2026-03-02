using MediatR;

namespace Fluxion.Application.Features.Authentication.RegisterSystemAdmin;

public record RegisterSystemAdminCommand(
    string FullName,
    string Email,
    string Password
) : IRequest<RegisterSystemAdminResponse>;
