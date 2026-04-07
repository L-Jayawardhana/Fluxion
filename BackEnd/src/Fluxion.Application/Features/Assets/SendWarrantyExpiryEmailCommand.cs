using Fluxion.Application.DTOs.Common;
using MediatR;

namespace Fluxion.Application.Features.Assets;

public record SendWarrantyExpiryEmailCommand(int AssetId) : IRequest<Result<string>>;
