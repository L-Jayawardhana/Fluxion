using MediatR;

namespace Fluxion.Application.Features.Assets;

public record GetAssetByIdQuery(int AssetId, int OrgId) : IRequest<AssetDto?>;
