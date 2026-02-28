using MediatR;

namespace Fluxion.Application.Features.Authentication.Welcome;

public record SendWelcomeEmailCommand(
    string Email,
    string FirstName,
    string OrgName,
    string WorkspaceSlug,
    string PlanName
) : IRequest<Unit>;
