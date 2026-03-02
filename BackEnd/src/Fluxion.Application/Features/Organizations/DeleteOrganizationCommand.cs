using MediatR;

namespace Fluxion.Application.Features.Organizations;

public record DeleteOrganizationCommand(int OrgId) : IRequest;
