namespace Fluxion.Application.Features.Organizations;

using MediatR;

public record GetOrganizationPlanQuery(int OrgId) : IRequest<string>;
