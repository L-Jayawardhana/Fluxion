using MediatR;

namespace Fluxion.Application.Features.Organizations;

public record CreateOrganizationCommand(
    string OrgName,
    string Slug,
    string? Timezone,
    int OwnerId
) : IRequest<CreateOrganizationResponse>;
