using Fluxion.Domain.Entities;
using Fluxion.Domain.Enums;

namespace Fluxion.UnitTests.Builders;

/// <summary>
/// Fluent builder for deterministic <see cref="User"/> test instances.
/// </summary>
public class UserBuilder
{
    private int _userId = 1;
    private int? _orgId = null;
    private string _fullName = "Test User";
    private string _email = "test@fluxion.dev";
    private string _passwordHash = "$2a$11$fakehashforTesting000000000000000000000000000";
    private UserRole _role = UserRole.user;
    private bool _mustChangePassword = false;
    private bool _isActive = true;
    private DateTime? _lastLoginAt = null;
    private DateTime _createdAt = new(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public UserBuilder WithUserId(int id) { _userId = id; return this; }
    public UserBuilder WithOrgId(int? orgId) { _orgId = orgId; return this; }
    public UserBuilder WithFullName(string name) { _fullName = name; return this; }
    public UserBuilder WithEmail(string email) { _email = email; return this; }
    public UserBuilder WithPasswordHash(string hash) { _passwordHash = hash; return this; }
    public UserBuilder WithRole(UserRole role) { _role = role; return this; }
    public UserBuilder WithMustChangePassword(bool val) { _mustChangePassword = val; return this; }
    public UserBuilder WithIsActive(bool active) { _isActive = active; return this; }
    public UserBuilder WithLastLoginAt(DateTime? dt) { _lastLoginAt = dt; return this; }
    public UserBuilder AsGoogleUser() { _passwordHash = ""; return this; }
    public UserBuilder AsDeactivated() { _isActive = false; return this; }

    public User Build() => new()
    {
        UserId = _userId,
        OrgId = _orgId,
        FullName = _fullName,
        Email = _email,
        PasswordHash = _passwordHash,
        Role = _role,
        MustChangePassword = _mustChangePassword,
        IsActive = _isActive,
        LastLoginAt = _lastLoginAt,
        CreatedAt = _createdAt,
        UpdatedAt = _createdAt
    };

    /// <summary>Pre-configured admin user.</summary>
    public static User AdminUser() => new UserBuilder()
        .WithUserId(10)
        .WithFullName("Admin User")
        .WithEmail("admin@fluxion.dev")
        .WithRole(UserRole.admin)
        .Build();

    /// <summary>Pre-configured deactivated user.</summary>
    public static User DeactivatedUser() => new UserBuilder()
        .WithUserId(20)
        .WithFullName("Inactive User")
        .WithEmail("inactive@fluxion.dev")
        .AsDeactivated()
        .Build();
}
