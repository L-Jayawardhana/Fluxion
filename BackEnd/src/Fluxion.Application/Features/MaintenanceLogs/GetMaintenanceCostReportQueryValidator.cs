using FluentValidation;

namespace Fluxion.Application.Features.MaintenanceLogs;

public class GetMaintenanceCostReportQueryValidator : AbstractValidator<GetMaintenanceCostReportQuery>
{
    public GetMaintenanceCostReportQueryValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page number at least greater than or equal to 1.");

        RuleFor(x => x.PageSize)
            .GreaterThanOrEqualTo(1)
            .WithMessage("PageSize at least greater than or equal to 1.");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("EndDate must be greater than or equal to StartDate.");
    }
}
