using FluentValidation;

namespace Fluxion.Application.Features.MaintenanceTickets;

public class CreateMaintenanceTicketCommandValidator : AbstractValidator<CreateMaintenanceTicketCommand>
{
    public CreateMaintenanceTicketCommandValidator()
    {
        RuleFor(x => x.AssetId)
            .GreaterThan(0).WithMessage("Asset ID must be valid.");

        RuleFor(x => x.OrgId)
            .GreaterThan(0).WithMessage("Organization ID must be valid.");

        RuleFor(x => x.RaisedBy)
            .GreaterThan(0).WithMessage("RaisedBy ID must be valid.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required.")
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.");

        RuleFor(x => x.Priority)
            .IsInEnum().WithMessage("Invalid Priority.");
    }
}
