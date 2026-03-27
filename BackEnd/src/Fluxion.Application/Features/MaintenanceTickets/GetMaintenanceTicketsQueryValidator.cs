using FluentValidation;
using Fluxion.Domain.Enums;

namespace Fluxion.Application.Features.MaintenanceTickets;

public class GetMaintenanceTicketsQueryValidator : AbstractValidator<GetMaintenanceTicketsQuery>
{
    public GetMaintenanceTicketsQueryValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1).WithMessage("PageNumber must be >= 1");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50).WithMessage("PageSize must be between 1 and 50");

        RuleFor(x => x)
            .Must(x => !x.DateFrom.HasValue || !x.DateTo.HasValue || x.DateFrom.Value <= x.DateTo.Value)
            .WithMessage("Invalid date range");

        RuleFor(x => x.Status)
            .IsInEnum().When(x => x.Status.HasValue).WithMessage("Invalid filter value");

        RuleFor(x => x.Priority)
            .IsInEnum().When(x => x.Priority.HasValue).WithMessage("Invalid filter value");
    }
}
