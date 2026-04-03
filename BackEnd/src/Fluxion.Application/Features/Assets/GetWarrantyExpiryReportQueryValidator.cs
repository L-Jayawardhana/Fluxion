using FluentValidation;

namespace Fluxion.Application.Features.Assets;

public class GetWarrantyExpiryReportQueryValidator : AbstractValidator<GetWarrantyExpiryReportQuery>
{
    public GetWarrantyExpiryReportQueryValidator()
    {
        RuleFor(x => x.DaysAhead)
            .InclusiveBetween(1, 730)
            .WithMessage("DaysAhead must be between 1 and 730.");

        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1)
            .WithMessage("PageNumber must be >= 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50)
            .WithMessage("PageSize must be between 1 and 50.");
    }
}
