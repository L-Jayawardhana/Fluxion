using FluentAssertions;
using Fluxion.Infrastructure.JWT;

namespace Fluxion.UnitTests.Services;

public class PasswordHasherTests
{
    private readonly PasswordHasher _hasher = new();

    [Fact]
    public void Hash_ReturnsNonEmptyString()
    {
        var hash = _hasher.Hash("TestPassword123!");
        hash.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void Hash_ReturnsBcryptFormat()
    {
        var hash = _hasher.Hash("TestPassword123!");
        hash.Should().StartWith("$2");  // BCrypt hashes start with $2a$, $2b$, etc.
    }

    [Fact]
    public void Hash_SameInputDifferentOutput()
    {
        var hash1 = _hasher.Hash("TestPassword123!");
        var hash2 = _hasher.Hash("TestPassword123!");

        hash1.Should().NotBe(hash2, "BCrypt uses a random salt each time");
    }

    [Fact]
    public void Verify_CorrectPassword_ReturnsTrue()
    {
        var password = "Str0ng!P@ssword";
        var hash = _hasher.Hash(password);

        _hasher.Verify(password, hash).Should().BeTrue();
    }

    [Fact]
    public void Verify_WrongPassword_ReturnsFalse()
    {
        var hash = _hasher.Hash("CorrectPassword1!");

        _hasher.Verify("WrongPassword1!", hash).Should().BeFalse();
    }

    [Fact]
    public void Verify_EmptyPassword_ReturnsFalse()
    {
        var hash = _hasher.Hash("SomePassword1!");

        _hasher.Verify("", hash).Should().BeFalse();
    }
}
