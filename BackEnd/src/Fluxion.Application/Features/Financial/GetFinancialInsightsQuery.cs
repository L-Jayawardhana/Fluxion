using System;
using Fluxion.Application.DTOs.Common;
using MediatR;

namespace Fluxion.Application.Features.Financial;

public record GetFinancialInsightsQuery : IRequest<Result<FinancialInsightsDto>>
{
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
}
