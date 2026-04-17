namespace Fluxion.Application.Features.Organizations;

using MediatR;

public record UpdateOrganizationPlanCommand(int OrgId, string PlanName) : IRequest;
