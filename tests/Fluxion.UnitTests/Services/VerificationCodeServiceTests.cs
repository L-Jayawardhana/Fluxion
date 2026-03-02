using FluentAssertions;
using Fluxion.Infrastructure.Services;

namespace Fluxion.UnitTests.Services;

public class VerificationCodeServiceTests
{
    private readonly InMemoryVerificationCodeService _service = new();

    [Fact]
    public void GenerateCode_Returns6DigitString()
    {
        var code = _service.GenerateCode("user@fluxion.dev");

        code.Should().HaveLength(6);
        code.Should().MatchRegex(@"^\d{6}$");
    }

    [Fact]
    public void ValidateCode_CorrectCode_ReturnsTrue()
    {
        var code = _service.GenerateCode("test@fluxion.dev");

        _service.ValidateCode("test@fluxion.dev", code).Should().BeTrue();
    }

    [Fact]
    public void ValidateCode_WrongCode_ReturnsFalse()
    {
        _service.GenerateCode("test@fluxion.dev");

        _service.ValidateCode("test@fluxion.dev", "000000").Should().BeFalse();
    }

    [Fact]
    public void ValidateCode_NoCodeGenerated_ReturnsFalse()
    {
        _service.ValidateCode("unknown@fluxion.dev", "123456").Should().BeFalse();
    }

    [Fact]
    public void ValidateCode_OneTimeUse_SecondCallReturnsFalse()
    {
        var code = _service.GenerateCode("otp@fluxion.dev");

        _service.ValidateCode("otp@fluxion.dev", code).Should().BeTrue();
        _service.ValidateCode("otp@fluxion.dev", code).Should().BeFalse("code is consumed after first use");
    }

    [Fact]
    public void ValidateCode_IsCaseInsensitiveForEmail()
    {
        var code = _service.GenerateCode("User@Fluxion.DEV");

        _service.ValidateCode("user@fluxion.dev", code).Should().BeTrue();
    }

    [Fact]
    public void GenerateCode_OverwritesPreviousCode()
    {
        var code1 = _service.GenerateCode("overwrite@fluxion.dev");
        var code2 = _service.GenerateCode("overwrite@fluxion.dev");

        // Old code should be invalid
        if (code1 != code2) // Extremely rare same random, but handle it
        {
            _service.ValidateCode("overwrite@fluxion.dev", code1).Should().BeFalse();
        }

        _service.ValidateCode("overwrite@fluxion.dev", code2).Should().BeTrue();
    }
}
