using FluentAssertions;
using Fluxion.Application.Features.Authentication.Login;
using FluentValidation.TestHelper;

namespace Fluxion.UnitTests.Authentication;

public class LoginCommandValidatorTests
{
    private readonly LoginCommandValidator _validator = new();

    [Fact]
    public void Valid_Login_Passes()
    {
        var command = new LoginCommand("user@fluxion.dev", "SomePassword");
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("", "Password is required but email missing")]
    [InlineData(null, "Null email")]
    public void Empty_Email_Fails(string? email, string _)
    {
        var command = new LoginCommand(email!, "password");
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Theory]
    [InlineData("not-an-email")]
    [InlineData("missing@")]
    [InlineData("@domain.com")]
    public void Invalid_Email_Format_Fails(string email)
    {
        var command = new LoginCommand(email, "password");
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Email)
            .WithErrorMessage("A valid email address is required.");
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Empty_Password_Fails(string? password)
    {
        var command = new LoginCommand("user@fluxion.dev", password!);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password is required.");
    }
}
