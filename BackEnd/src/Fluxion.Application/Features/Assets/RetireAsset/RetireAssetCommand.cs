using MediatR;

namespace Fluxion.Application.Features.Assets.RetireAsset;

public record RetireAssetCommand(int AssetId, int OrgId, int RetiredBy) : IRequest;
