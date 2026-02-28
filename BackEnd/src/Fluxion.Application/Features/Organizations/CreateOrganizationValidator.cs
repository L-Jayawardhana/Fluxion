using FluentValidation;

namespace Fluxion.Application.Features.Organizations;

public class CreateOrganizationValidator : AbstractValidator<CreateOrganizationCommand>
{
    public CreateOrganizationValidator()
    {
        RuleFor(x => x.OrgName)
            .NotEmpty().WithMessage("Organisation name is required.")
            .MaximumLength(150).WithMessage("Organisation name must be 150 characters or fewer.");

        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("URL slug is required.")
            .MaximumLength(100).WithMessage("Slug must be 100 characters or fewer.")
            .Matches(@"^[a-z0-9]+(?:-[a-z0-9]+)*$").WithMessage("Slug must be lowercase letters, numbers, and dashes only.");

        RuleFor(x => x.OwnerId)
            .GreaterThan(0).WithMessage("Owner ID is required.");
    }
}
