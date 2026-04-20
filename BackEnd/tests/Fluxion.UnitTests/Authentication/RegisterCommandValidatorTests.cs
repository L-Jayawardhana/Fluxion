using FluentAssertions;
using Fluxion.Application.Features.Authentication.Register;
using FluentValidation.TestHelper;

namespace Fluxion.UnitTests.Authentication;

public class RegisterCommandValidatorTests
{
    private readonly RegisterCommandValidator _validator = new();

    [Fact]
    public void Valid_Registration_Passes()
    {
        var command = new RegisterCommand("Jane Doe", "jane@fluxion.dev", "Str0ng!Pa$$", null);
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }

    // ── Full Name ──

    [Fact]
    public void Empty_FullName_Fails()
    {
        var command = new RegisterCommand("", "a@b.com", "Str0ng!Pa$$", null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.FullName)
            .WithErrorMessage("Full name is required.");
    }

    [Fact]
    public void FullName_Over100_Fails()
    {
        var longName = new string('A', 101);
        var command = new RegisterCommand(longName, "a@b.com", "Str0ng!Pa$$", null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.FullName)
            .WithErrorMessage("Full name must not exceed 100 characters.");
    }

    // ── Email ──

    [Fact]
    public void Empty_Email_Fails()
    {
        var command = new RegisterCommand("Name", "", "Str0ng!Pa$$", null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Invalid_Email_Fails()
    {
        var command = new RegisterCommand("Name", "not-valid", "Str0ng!Pa$$", null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Email)
            .WithErrorMessage("A valid email address is required.");
    }

    [Fact]
    public void Email_Over150_Fails()
    {
        var longEmail = new string('a', 140) + "@test.com"; // 149 chars, within limit
        var tooLong = new string('a', 145) + "@test.com";   // 154 chars, over limit
        var result = _validator.TestValidate(new RegisterCommand("N", tooLong, "Str0ng!Pa$$", null));
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    // ── Password ──

    [Fact]
    public void Empty_Password_Fails()
    {
        var command = new RegisterCommand("Name", "a@b.com", "", null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void Password_TooShort_Fails()
    {
        var command = new RegisterCommand("Name", "a@b.com", "Ab1!", null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password must be at least 8 characters.");
    }

    [Fact]
    public void Password_NoUppercase_Fails()
    {
        var command = new RegisterCommand("Name", "a@b.com", "abcdefg1!", null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password must contain at least one uppercase letter.");
    }

    [Fact]
    public void Password_NoLowercase_Fails()
    {
        var command = new RegisterCommand("Name", "a@b.com", "ABCDEFG1!", null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password must contain at least one lowercase letter.");
    }

    [Fact]
    public void Password_NoDigit_Fails()
    {
        var command = new RegisterCommand("Name", "a@b.com", "Abcdefgh!", null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password must contain at least one digit.");
    }

    [Fact]
    public void Password_NoSpecialChar_Fails()
    {
        var command = new RegisterCommand("Name", "a@b.com", "Abcdefg1", null);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Password)
            .WithErrorMessage("Password must contain at least one special character.");
    }
}
