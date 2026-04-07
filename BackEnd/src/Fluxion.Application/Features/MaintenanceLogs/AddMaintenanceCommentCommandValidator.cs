using FluentValidation;

namespace Fluxion.Application.Features.MaintenanceLogs;

public class AddMaintenanceCommentCommandValidator : AbstractValidator<AddMaintenanceCommentCommand>
{
    public AddMaintenanceCommentCommandValidator()
    {
        RuleFor(x => x.TicketId)
            .GreaterThan(0).WithMessage("TicketId must be valid");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Content is required")
            .MaximumLength(500).WithMessage("Content cannot exceed 500 characters");
    }
}
