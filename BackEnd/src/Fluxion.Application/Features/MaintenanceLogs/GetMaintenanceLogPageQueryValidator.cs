using FluentValidation;

namespace Fluxion.Application.Features.MaintenanceLogs;

public class GetMaintenanceLogPageQueryValidator : AbstractValidator<GetMaintenanceLogPageQuery>
{
    public GetMaintenanceLogPageQueryValidator()
    {
        RuleFor(x => x.AssetId)
            .GreaterThan(0).WithMessage("AssetId must be valid");

        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1).WithMessage("PageNumber must be >= 1");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50).WithMessage("PageSize must be between 1 and 50");
    }
}
