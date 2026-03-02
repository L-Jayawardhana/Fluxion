using MediatR;

namespace Fluxion.Application.Features.Organizations;

public record GetAllOrganizationsQuery : IRequest<List<OrganizationDto>>;

public record OrganizationDto(
    int OrgId,
    string OrgName,
    string Slug,
    int? OwnerId,
    string? LogoUrl,
    string? Timezone,
    bool IsActive,
    DateTime CreatedAt,
    int UsersCount,
    int AssetsCount
);
