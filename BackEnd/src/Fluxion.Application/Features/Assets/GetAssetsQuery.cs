using MediatR;

namespace Fluxion.Application.Features.Assets;

public record GetAssetsQuery(
    int OrgId,
    int? DepartmentId = null,
    string? AssetType = null
) : IRequest<List<AssetDto>>;
