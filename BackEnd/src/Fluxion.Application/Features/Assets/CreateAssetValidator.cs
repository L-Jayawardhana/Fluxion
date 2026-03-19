using FluentValidation;

namespace Fluxion.Application.Features.Assets;

public class CreateAssetValidator : AbstractValidator<CreateAssetCommand>
{
    public CreateAssetValidator()
    {
        RuleFor(x => x.OrgId)
            .GreaterThan(0).WithMessage("Organisation ID is required.");

        RuleFor(x => x.DepartmentId)
            .GreaterThan(0).WithMessage("Department ID is required.");

        RuleFor(x => x.AssetName)
            .NotEmpty().WithMessage("Asset name is required.")
            .MaximumLength(100).WithMessage("Asset name must be 100 characters or fewer.");

        RuleFor(x => x.AssetType)
            .NotEmpty().WithMessage("Asset type is required.")
            .MaximumLength(50).WithMessage("Asset type must be 50 characters or fewer.");

        RuleFor(x => x.AssetTag)
            .MaximumLength(50).WithMessage("Asset tag must be 50 characters or fewer.")
            .When(x => x.AssetTag is not null);

        RuleFor(x => x.SerialNumber)
            .MaximumLength(100).WithMessage("Serial number must be 100 characters or fewer.")
            .When(x => x.SerialNumber is not null);

        RuleFor(x => x.Cost)
            .GreaterThanOrEqualTo(0).WithMessage("Cost must be zero or greater.")
            .When(x => x.Cost.HasValue);
    }
}
