using MediatR;

namespace Fluxion.Application.Features.Organizations;

public record UpdateOrganizationCommand(
    int OrgId,
    string OrgName,
    string Slug,
    string? Timezone,
    bool IsActive
) : IRequest;
