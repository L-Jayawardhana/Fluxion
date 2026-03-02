namespace Fluxion.Application.Features.Organizations;

public record CreateOrganizationResponse(
    int OrgId,
    string OrgName,
    string Slug,
    string? LogoUrl
);
