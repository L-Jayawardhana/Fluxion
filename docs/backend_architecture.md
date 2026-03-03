# Backend Architecture — Fluxion API

> **Runtime**: .NET 8 (ASP.NET Core Web API)
> **Database**: MySQL (Pomelo EF Core provider)
> **Pattern**: Clean Architecture + CQRS (MediatR)
> **Solution**: `BackEnd/Fluxion.sln`

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Project Structure](#2-project-structure)
3. [Layer Dependency Graph](#3-layer-dependency-graph)
4. [Fluxion.Domain](#4-fluxiondomain)
5. [Fluxion.Application](#5-fluxionapplication)
6. [Fluxion.Infrastructure](#6-fluxioninfrastructure)
7. [Fluxion.Persistence](#7-fluxionpersistence)
8. [Fluxion.API](#8-fluxionapi)
9. [Authentication & Authorisation](#9-authentication--authorisation)
10. [Email System](#10-email-system)
11. [Database Schema](#11-database-schema)
12. [API Endpoints](#12-api-endpoints)
13. [Configuration](#13-configuration)
14. [Deployment & Docker](#14-deployment--docker)
15. [Testing](#15-testing)
16. [NuGet Packages](#16-nuget-packages)

---

## 1. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        Client (React SPA)                         │
│               Vercel (FrontEnd) / Vercel (AdminDash)              │
└──────────────────────────┬─────────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     nginx reverse proxy                          │
│              (TLS termination, /api → backend:80)                │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTP (internal)
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Fluxion.API (.NET 8)                        │
│           Controllers → MediatR → Handlers → DbContext           │
└──────────────────────────┬───────────────────────────────────────┘
                           │ EF Core (Pomelo)
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                        MySQL Database                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Project Structure

```
BackEnd/
├── Fluxion.sln
└── src/
    ├── Dockerfile
    ├── NuGet.Config
    ├── Fluxion.Domain/             ← Entities, Enums, Base classes (no deps)
    ├── Fluxion.Application/        ← CQRS Features, Interfaces, Behaviors, DTOs
    ├── Fluxion.Infrastructure/     ← JWT, Email, Password hashing, Verification
    ├── Fluxion.Persistence/        ← EF Core DbContext, Migrations, Repositories
    └── Fluxion.API/                ← ASP.NET Core host, Controllers, Middleware
        ├── Controllers/
        ├── Extensions/
        ├── Filters/
        ├── Middleware/
        ├── Properties/
        ├── wwwroot/
        │   └── images/
        ├── Program.cs
        └── appsettings.json
```

### Solution Projects

| Project | Type | Description |
|---------|------|-------------|
| `Fluxion.Domain` | Class Library | Core domain: entities, enums, base classes. Zero external dependencies. |
| `Fluxion.Application` | Class Library | Use cases: CQRS commands/queries, handlers, validators, interfaces. |
| `Fluxion.Infrastructure` | Class Library | External concerns: JWT, SMTP email, password hashing, verification codes. |
| `Fluxion.Persistence` | Class Library | Data access: EF Core DbContext, configurations, migrations, repositories. |
| `Fluxion.API` | Web API | HTTP host: controllers, middleware, DI composition root, startup. |
| `Fluxion.UnitTests` | xUnit | Unit test project. |
| `Fluxion.IntegrationTests` | xUnit | Integration test project. |
| `Fluxion.SeleniumTests` | xUnit | Browser-based end-to-end test project. |

---

## 3. Layer Dependency Graph

```
Fluxion.API
  ├── Fluxion.Application
  ├── Fluxion.Infrastructure
  └── Fluxion.Persistence

Fluxion.Infrastructure
  └── Fluxion.Application

Fluxion.Persistence
  ├── Fluxion.Application
  └── Fluxion.Domain

Fluxion.Application
  └── Fluxion.Domain

Fluxion.Domain
  └── (no project references — pure C#)
```

**Dependency Rule**: Dependencies always point inward. Domain has zero references. Application depends only on Domain. Infrastructure and Persistence implement interfaces defined in Application.

```
┌─────────────────────────────────────────┐
│              Fluxion.API                │  ← Outermost (composition root)
│  ┌─────────────────────────────────┐    │
│  │       Fluxion.Infrastructure    │    │  ← External services
│  │       Fluxion.Persistence       │    │  ← Data access
│  │  ┌─────────────────────────┐    │    │
│  │  │   Fluxion.Application   │    │    │  ← Use cases
│  │  │  ┌─────────────────┐    │    │    │
│  │  │  │ Fluxion.Domain  │    │    │    │  ← Core domain
│  │  │  └─────────────────┘    │    │    │
│  │  └─────────────────────────┘    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

## 4. Fluxion.Domain

The innermost layer. Contains only POCO entities, enums, and base abstractions. No NuGet dependencies, no project references.

### Base Classes

| Type | File | Description |
|------|------|-------------|
| `BaseEntity` | `Base/BaseEntity.cs` | Abstract base with `Guid Id`, `CreatedAt`, `UpdatedAt`. |
| `IAuditable` | `Base/IAuditable.cs` | Interface requiring `UpdatedAt` property. |

```csharp
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public interface IAuditable
{
    DateTime UpdatedAt { get; set; }
}
```

### Entities (10)

| Entity | PK | Key Relationships | Implements |
|--------|----|--------------------|------------|
| `User` | `UserId` (int) | → Organization (optional FK), ← UserDepartments, ← AssetAssignments | `IAuditable` |
| `Organization` | `OrgId` (int) | ← Users, ← Departments, ← Assets | `IAuditable` |
| `Department` | `DepartmentId` (int) | → Organization, ← UserDepartments | `IAuditable` |
| `Asset` | `AssetId` (int) | → Organization, → Department (optional), ← Assignments | `IAuditable` |
| `AssetAssignment` | `AssignmentId` (int) | → Asset, → User | `IAuditable` |
| `UserDepartment` | `Id` (int) | → User, → Department | — |
| `MaintenanceTicket` | `TicketId` (int) | → Asset | `IAuditable` |
| `MaintenanceLog` | `LogId` (int) | → MaintenanceTicket | — |
| `SubscriptionPlan` | `PlanId` (int) | ← OrgSubscriptions | — |
| `OrgSubscription` | `SubId` (int) | → Organization, → SubscriptionPlan | `IAuditable` |

#### User Entity (detailed)

```csharp
public class User : IAuditable
{
    public int UserId { get; set; }
    public int? OrgId { get; set; }                // nullable — system admins have no org
    public string FullName { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }       // BCrypt hash (empty for Google users)
    public UserRole Role { get; set; }
    public bool MustChangePassword { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public Organization? Organization { get; set; }
    public ICollection<UserDepartment>? UserDepartments { get; set; }
    public ICollection<AssetAssignment>? AssetAssignments { get; set; }
}
```

#### Organization Entity (detailed)

```csharp
public class Organization : IAuditable
{
    public int OrgId { get; set; }
    public string OrgName { get; set; }
    public string Slug { get; set; }               // URL-safe identifier
    public int? OwnerId { get; set; }              // plain INT (no FK constraint)
    public string? LogoUrl { get; set; }           // /uploads/logos/org-{id}-{guid}.ext
    public string? Timezone { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public ICollection<User>? Users { get; set; }
    public ICollection<Department>? Departments { get; set; }
    public ICollection<Asset>? Assets { get; set; }
}
```

#### Asset Entity (detailed)

```csharp
public class Asset : IAuditable
{
    public int AssetId { get; set; }
    public int OrgId { get; set; }
    public int? DepartmentId { get; set; }
    public string AssetName { get; set; }
    public string AssetType { get; set; }
    public string? AssetTag { get; set; }
    public string? SerialNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public DateTime? WarrantyEndDate { get; set; }
    public decimal? Cost { get; set; }             // decimal(10,2)
    public AssetStatus Status { get; set; }
    public string? QrCode { get; set; }
    public DateTime? RetiredAt { get; set; }
    public int? RetiredBy { get; set; }
    public int CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### Enums (6)

| Enum | Values |
|------|--------|
| `UserRole` | `owner`, `admin`, `technician`, `user`, `systemadmin` |
| `AssetStatus` | `available`, `assigned`, `under_maintenance`, `retired` |
| `TicketStatus` | `open`, `assigned`, `in_progress`, `waiting_parts`, `resolved`, `closed` |
| `TicketPriority` | `low`, `medium`, `high`, `critical` |
| `BillingCycle` | `monthly`, `annual` |
| `SubscriptionStatus` | `trialing`, `active`, `past_due`, `cancelled` |

---

## 5. Fluxion.Application

The use-case layer. Defines all business operations as CQRS commands/queries using MediatR. Contains no infrastructure code — only interfaces that outer layers implement.

### Interfaces (5)

| Interface | File | Methods |
|-----------|------|---------|
| `IApplicationDbContext` | `Interfaces/IApplicationDbContext.cs` | 10 `DbSet<T>` properties + `SaveChangesAsync()` |
| `IEmailService` | `Interfaces/IEmailService.cs` | `SendEmailAsync(toEmail, subject, htmlBody)` |
| `IJwtTokenService` | `Interfaces/IJwtTokenService.cs` | `GenerateToken(user, rememberMe)`, `GetTokenExpiryUnixSeconds(rememberMe)` |
| `IPasswordHasher` | `Interfaces/IPasswordHasher.cs` | `Hash(password)`, `Verify(password, hash)` |
| `IVerificationCodeService` | `Interfaces/IVerificationCodeService.cs` | `GenerateCode(email)`, `ValidateCode(email, code)` |

### Validation Pipeline (FluentValidation)

```csharp
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
{
    // Runs ALL registered validators for TRequest before the handler executes.
    // If any validator fails → throws FluentValidation.ValidationException.
}
```

Registered in `Program.cs`:
```csharp
builder.Services.AddValidatorsFromAssembly(typeof(LoginCommand).Assembly);
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
```

### Features (CQRS Handlers)

Features are grouped by domain aggregate under `Features/`:

```
Features/
├── Authentication/
│   ├── Login/              → LoginCommand → LoginResponse
│   ├── Register/           → RegisterCommand → RegisterResponse
│   ├── RegisterSystemAdmin/→ RegisterSystemAdminCommand → RegisterSystemAdminResponse
│   ├── GoogleLogin/        → GoogleLoginCommand → GoogleLoginResponse
│   ├── Verification/       → SendVerificationCodeCommand, VerifyCodeCommand
│   ├── Welcome/            → SendWelcomeEmailCommand → Unit
│   └── ForgotPassword/     → ForgotPasswordCommand, ResetPasswordCommand
├── Organizations/
│   ├── Create              → CreateOrganizationCommand → CreateOrganizationResponse
│   ├── GetAll              → GetAllOrganizationsQuery → List<OrganizationDto>
│   ├── Update              → UpdateOrganizationCommand → void
│   ├── Delete              → DeleteOrganizationCommand → void
│   └── UpdateLogo          → UpdateOrgLogoCommand → Unit
├── Users/
│   ├── GetAll              → GetAllUsersQuery → List<UserDto>
│   ├── Update              → UpdateUserCommand → void
│   └── Delete              → DeleteUserCommand → void
└── AssetManagement/        → (placeholder — not yet implemented)
```

### Feature Detail: Authentication

#### Login Flow
```
LoginCommand { Email, Password, RememberMe }
  → LoginCommandValidator (FluentValidation)
  → LoginCommandHandler
      1. Find user by email
      2. Check IsActive
      3. Verify password (BCrypt)
      4. Update LastLoginAt
      5. Generate JWT token
  → LoginResponse { Token, UserId, FullName, Email, Role, MustChangePassword, ExpiresAt }
```

#### Register Flow
```
RegisterCommand { FullName, Email, Password, OrgId? }
  → RegisterCommandValidator (email format, min 8 chars, uppercase, lowercase, digit, special char)
  → RegisterCommandHandler
      1. Check email uniqueness
      2. Validate OrgId exists (if provided)
      3. Create User (Role = user, hash password)
      4. Generate JWT token
  → RegisterResponse { UserId, FullName, Email, Role, Token }
```

#### Register System Admin Flow
```
RegisterSystemAdminCommand { FullName, Email, Password }
  → RegisterSystemAdminCommandHandler
      1. Check email uniqueness
      2. Create User (Role = systemadmin, OrgId = null)
      3. Generate JWT token
  → RegisterSystemAdminResponse { UserId, FullName, Email, Role, Token }
```

#### Google Login Flow
```
GoogleLoginCommand { IdToken }
  → GoogleLoginHandler
      1. Validate Google ID token via Google.Apis.Auth
      2. Verify email is verified
      3. Find or create user (new users get Role = user, empty PasswordHash)
      4. Generate JWT token
  → GoogleLoginResponse { UserId, FullName, Email, Role, Token, IsNewUser }
```

#### Email Verification Flow
```
SendVerificationCodeCommand { Email }
  → SendVerificationCodeHandler
      1. Generate 6-digit code (10-min expiry)
      2. Send branded HTML email with code
  → SendVerificationCodeResponse { Success, Message }

VerifyCodeCommand { Email, Code }
  → VerifyCodeHandler
      1. Validate code against in-memory store
      2. One-time use — code is consumed
  → VerifyCodeResponse { IsValid, Message }
```

#### Forgot Password Flow
```
ForgotPasswordCommand { Email }
  → ForgotPasswordHandler
      1. Lookup user (always return success to prevent email enumeration)
      2. Generate 6-digit code
      3. Send branded HTML email with reset code
  → ForgotPasswordResponse { Success, Message }

ResetPasswordCommand { Email, Code, NewPassword }
  → ResetPasswordHandler
      1. Validate verification code
      2. Hash new password (BCrypt)
      3. Set MustChangePassword = false
  → ResetPasswordResponse { Success, Message }
```

#### Welcome Email Flow
```
SendWelcomeEmailCommand { Email, FirstName, OrgName, WorkspaceSlug, PlanName }
  → SendWelcomeEmailHandler
      1. Build 417-line branded HTML email with personalisation
      2. Send via SMTP
  → Unit (void)
```

### Feature Detail: Organizations

| Operation | Type | Description |
|-----------|------|-------------|
| **Create** | Command | Creates org, assigns owner (`Role → owner`, `OrgId → org.OrgId`). Validates slug uniqueness. |
| **GetAll** | Query | Returns all orgs with owner name, user count, asset count. Uses LEFT JOIN for owner. |
| **Update** | Command | Updates OrgName, Slug, Timezone, IsActive. Validates ID match. |
| **Delete** | Command | Hard deletes organization from database. |
| **UpdateLogo** | Command | Sets `LogoUrl` on organization. Called after file upload in controller. |

### Feature Detail: Users

| Operation | Type | Description |
|-----------|------|-------------|
| **GetAll** | Query | Returns all users. Optional `orgId` filter. Includes OrganizationName via nav property. |
| **Update** | Command | Updates FullName, Email, Role (parsed from string), IsActive, OrgId. |
| **Delete** | Command | Hard deletes user from database. |

### DTOs

```csharp
// Organization DTO (returned by GetAllOrganizations)
public record OrganizationDto(
    int OrgId, string OrgName, string Slug, int? OwnerId,
    string? OwnerName, string? LogoUrl, string? Timezone,
    bool IsActive, DateTime CreatedAt, int UsersCount, int AssetsCount
);

// User DTO (returned by GetAllUsers)
public record UserDto(
    int UserId, int? OrgId, string FullName, string Email,
    string Role, bool IsActive, DateTime? LastLoginAt,
    DateTime CreatedAt, string? OrganizationName
);
```

### Validators

| Validator | Target | Rules |
|-----------|--------|-------|
| `LoginCommandValidator` | `LoginCommand` | Email required + valid format, Password required |
| `RegisterCommandValidator` | `RegisterCommand` | FullName required (max 100), Email required + valid (max 150), Password min 8 + uppercase + lowercase + digit + special char |
| `CreateOrganizationValidator` | `CreateOrganizationCommand` | OrgName required (max 150), Slug required (max 100, regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`), OwnerId > 0 |

---

## 6. Fluxion.Infrastructure

Implements external-facing interfaces defined in `Fluxion.Application`.

### Dependency Injection Registration

```csharp
public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
{
    services.Configure<JwtSettings>(config.GetSection("JwtSettings"));
    services.Configure<SmtpSettings>(config.GetSection("SmtpSettings"));

    services.AddScoped<IPasswordHasher, PasswordHasher>();
    services.AddScoped<IJwtTokenService, JwtTokenService>();
    services.AddScoped<IEmailService, SmtpEmailService>();
    services.AddSingleton<IVerificationCodeService, InMemoryVerificationCodeService>();  // singleton — persists across requests
}
```

### JWT (`JWT/`)

#### JwtSettings
```csharp
public class JwtSettings
{
    public string SecretKey { get; set; }
    public string Issuer { get; set; }            // "Fluxion"
    public string Audience { get; set; }           // "FluxionUsers"
    public int ExpiryMinutes { get; set; } = 60;   // default 1 hour
    public int RememberMeExpiryMinutes { get; set; } = 10080;  // 7 days
}
```

#### JwtTokenService
- Signs tokens with `HmacSha256`.
- Claims included: `sub` (UserId), `email`, `role`, `OrgId`, `jti` (unique ID).
- Supports `rememberMe` flag for extended expiry (7 days vs 1 hour).

#### PasswordHasher
- Uses `BCrypt.Net-Next` for password hashing.
- `Hash(password)` → BCrypt hash string.
- `Verify(password, hash)` → boolean.

### Email (`Email/`)

#### SmtpSettings
```csharp
public class SmtpSettings
{
    public string Host { get; set; }       // e.g. smtp.gmail.com
    public int Port { get; set; }           // 465 (SSL) or 587 (STARTTLS)
    public string Username { get; set; }
    public string Password { get; set; }
    public bool EnableSsl { get; set; }
    public string FromEmail { get; set; }   // no-reply@fluxion.io
    public string FromName { get; set; }    // "Fluxion"
}
```

#### SmtpEmailService
- Uses **MailKit** (`SmtpClient`) for sending.
- Auto-detects SSL mode: Port 465 → `SslOnConnect`, Port 587 → `StartTls`.
- Logs success/failure via `ILogger<SmtpEmailService>`.
- Sends HTML-formatted emails (verification codes, welcome emails, password resets).

### Verification Codes (`Services/`)

#### InMemoryVerificationCodeService
- **Singleton** — codes persist across HTTP requests in same app lifetime.
- Uses `ConcurrentDictionary<string, (string Code, DateTime Expiry)>`.
- Generates 6-digit numeric codes (100000–999999).
- Codes expire after **10 minutes**.
- Codes are **one-time use** — consumed on successful validation.
- Key is `email.ToLowerInvariant()` (case-insensitive).

> **Note**: In-memory storage means codes are lost on app restart. A Redis/database-backed implementation is recommended for production HA deployments.

---

## 7. Fluxion.Persistence

Data access layer using Entity Framework Core with the Pomelo MySQL provider.

### Dependency Injection Registration

```csharp
public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration config)
{
    var connectionString = config.GetConnectionString("DefaultConnection");

    services.AddDbContext<FluxionDbContext>(options =>
        options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

    services.AddScoped<IApplicationDbContext>(provider =>
        provider.GetRequiredService<FluxionDbContext>());
}
```

### FluxionDbContext

Inherits `DbContext` and implements `IApplicationDbContext`.

```csharp
public class FluxionDbContext : DbContext, IApplicationDbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<OrgSubscription> OrgSubscriptions => Set<OrgSubscription>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<UserDepartment> UserDepartments => Set<UserDepartment>();
    public DbSet<Asset> Assets => Set<Asset>();
    public DbSet<AssetAssignment> AssetAssignments => Set<AssetAssignment>();
    public DbSet<MaintenanceTicket> MaintenanceTickets => Set<MaintenanceTicket>();
    public DbSet<MaintenanceLog> MaintenanceLogs => Set<MaintenanceLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(FluxionDbContext).Assembly);
    }
}
```

### Migrations

| Migration | Date | Description |
|-----------|------|-------------|
| `InitialCreate` | 2026-02-26 | Full schema: all 10 tables |
| `MakeUserOrgIdNullable` | 2026-02-26 | Changed `User.OrgId` from `int` to `int?` (system admins have no org) |
| `AddPasswordResetFields` | 2026-02-28 | Added password reset support fields |

### Database Provider

- **Provider**: `Pomelo.EntityFrameworkCore.MySql 8.0.3`
- **Server version**: Auto-detected from connection string.
- **Connection string**: Injected via `ConnectionStrings:DefaultConnection` env var.

---

## 8. Fluxion.API

The outermost layer — the ASP.NET Core web host and composition root.

### Program.cs — Startup Pipeline

```
1. AddPersistence(config)          ← EF Core + MySQL
2. AddInfrastructure(config)       ← JWT, Email, Password, Verification
3. AddMediatR(LoginCommand.Asm)    ← Scans Application assembly for handlers
4. AddValidatorsFromAssembly(...)  ← FluentValidation validators
5. AddTransient<ValidationBehavior>← Pipeline behavior
6. JWT Authentication              ← JwtBearer with configurable issuer/audience/key
7. AddControllers                  ← API controllers
8. AddSwagger                      ← OpenAPI (dev only)
9. AddCors("AllowAll")             ← Dynamic policy (dev: any origin; prod: env-configured)

── Middleware Pipeline ──
10. Swagger (dev only)
11. ForwardedHeaders               ← Trust nginx X-Forwarded-For/Proto
12. CORS
13. Authentication
14. Authorisation
15. MapControllers
```

### Controllers (4)

#### AuthController (`/api/Auth`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/Auth/login` | POST | Email + password login → JWT |
| `/api/Auth/register` | POST | New user registration → JWT |
| `/api/Auth/register-system-admin` | POST | System admin signup → JWT |
| `/api/Auth/google` | POST | Google OAuth ID token → JWT |
| `/api/Auth/send-verification-code` | POST | Send 6-digit email code |
| `/api/Auth/verify-code` | POST | Validate email code |
| `/api/Auth/send-welcome-email` | POST | Trigger branded welcome email |
| `/api/Auth/forgot-password` | POST | Send password reset code |
| `/api/Auth/reset-password` | POST | Reset password with code |

#### OrganizationController (`/api/Organization`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/Organization` | GET | List all organizations |
| `/api/Organization` | POST | Create new organization |
| `/api/Organization/{id}` | PUT | Update organization |
| `/api/Organization/{id}` | DELETE | Hard delete organization |
| `/api/Organization/{id}/logo` | POST | Upload org logo (multipart) |

**Logo Upload Details**:
- Accepted formats: `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`
- Max size: 2 MB
- Stored at: `wwwroot/uploads/logos/org-{id}-{guid}.{ext}`
- Returns: `{ logoUrl: "/uploads/logos/..." }`

#### UserController (`/api/User`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/User` | GET | List all users (optional `?orgId=` filter) |
| `/api/User/{id}` | PUT | Update user details |
| `/api/User/{id}` | DELETE | Hard delete user |

#### HealthController (`/api/Health`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/Health` | GET | Health check with DB connectivity status |

**Response shape**:
```json
{
  "status": "Healthy",
  "timestamp": "2026-03-03T12:00:00Z",
  "database": "Connected"
}
```

### CORS Configuration

```
Development:
  → AllowAnyOrigin, AllowAnyMethod, AllowAnyHeader

Production:
  → AllowedOrigins from env vars (AllowedOrigins__0, AllowedOrigins__1)
  → AllowCredentials
  → Fallback to AllowAnyOrigin if no origins configured
```

Environment variables (set via GitHub Secrets → VM `.env`):
- `AllowedOrigins__0` = Vercel user-app URL
- `AllowedOrigins__1` = Vercel admin-app URL

### Static Files

- `wwwroot/images/` — Static assets
- `wwwroot/uploads/logos/` — Organisation logos (created at runtime)

---

## 9. Authentication & Authorisation

### JWT Token Structure

| Claim | Value |
|-------|-------|
| `sub` | UserId (int) |
| `email` | User email |
| `role` | UserRole enum value string |
| `OrgId` | Organisation ID (or null) |
| `jti` | Unique GUID per token |

### Token Expiry

| Mode | Duration |
|------|----------|
| Standard | 60 minutes (configurable) |
| Remember Me | 10,080 minutes (7 days) |

### Authentication Pipeline

```
Client sends:  Authorization: Bearer <jwt>
                    ↓
ASP.NET JwtBearer middleware validates:
  ✓ Issuer == "Fluxion"
  ✓ Audience == "FluxionUsers"
  ✓ Lifetime (not expired)
  ✓ Signature (HMAC-SHA256)
                    ↓
Claims principal set on HttpContext.User
```

### Google OAuth Flow

```
Client (React)                         Backend
     │                                    │
     │ 1. Google Sign-In button click     │
     │ → Google OAuth consent screen      │
     │ ← Google ID Token                  │
     │                                    │
     │ 2. POST /api/Auth/google           │
     │    { idToken: "..." }              │
     │ ─────────────────────────────────► │
     │                                    │ 3. Validate token via Google.Apis.Auth
     │                                    │ 4. Find or create User
     │                                    │ 5. Generate Fluxion JWT
     │ ◄───────────────────────────────── │
     │    { token, userId, isNewUser }    │
```

### Password Policy (Registration)

- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 digit (0-9)
- At least 1 special character

---

## 10. Email System

### Email Types

| Email | Trigger | Handler |
|-------|---------|---------|
| **Verification Code** | Registration, sign-up | `SendVerificationCodeHandler` |
| **Welcome** | After org creation | `SendWelcomeEmailHandler` |
| **Password Reset Code** | Forgot password | `ForgotPasswordHandler` |

### Email Template Features

All emails are sent as **rich HTML** with:
- Branded Fluxion header
- Inline CSS (email-client compatible)
- Responsive layout
- Personalised content (name, org, code)
- Call-to-action buttons
- Footer with support info

### SMTP Configuration

| Setting | Default | Env Variable |
|---------|---------|--------------|
| Host | `smtp.gmail.com` | `SmtpSettings__Host` |
| Port | `465` | `SmtpSettings__Port` |
| Username | — | `SmtpSettings__Username` |
| Password | — | `SmtpSettings__Password` |
| From Email | `no-reply@fluxion.io` | `SmtpSettings__FromEmail` |
| From Name | `Fluxion` | `SmtpSettings__FromName` |
| SSL | `true` | `SmtpSettings__EnableSsl` |

---

## 11. Database Schema

### Entity-Relationship Diagram

```
┌──────────────────┐       ┌──────────────────────┐
│  SubscriptionPlan │◄──┐  │    Organization       │
│  ─────────────── │   │  │  ──────────────────── │
│  PlanId (PK)     │   │  │  OrgId (PK)           │
│  PlanName        │   │  │  OrgName              │
│  PriceMonthly    │   │  │  Slug                 │
│  PriceAnnual?    │   │  │  OwnerId?             │
│  MaxUsers?       │   │  │  LogoUrl?             │
│  MaxAssets?      │   │  │  Timezone?            │
│  Features? (JSON)│   │  │  IsActive             │
│  IsActive        │   │  │  CreatedAt / UpdatedAt│
└──────────────────┘   │  └──────┬──────┬─────────┘
                       │         │      │
              ┌────────┘    ┌────┘      └────┐
              │             │                │
┌─────────────┴────┐  ┌────┴────────┐  ┌────┴────────────┐
│  OrgSubscription  │  │   User      │  │   Department     │
│  ──────────────── │  │  ────────── │  │  ─────────────── │
│  SubId (PK)       │  │  UserId(PK) │  │  DepartmentId(PK)│
│  OrgId (FK)       │  │  OrgId?(FK) │  │  OrgId (FK)      │
│  PlanId (FK)      │  │  FullName   │  │  DepartmentName  │
│  BillingCycle     │  │  Email      │  │  Location?       │
│  StartedAt        │  │  Password   │  └──────┬───────────┘
│  ExpiresAt?       │  │  Role       │         │
│  Status           │  │  IsActive   │         │
└──────────────────┘  │  LastLogin? │         │
                       └──┬───┬─────┘         │
                          │   │               │
              ┌───────────┘   │    ┌──────────┘
              │               │    │
┌─────────────┴──────┐  ┌────┴────┴────────────┐
│  AssetAssignment    │  │  UserDepartment       │
│  ───────────────── │  │  ──────────────────── │
│  AssignmentId (PK) │  │  Id (PK)              │
│  OrgId             │  │  OrgId                │
│  AssetId (FK)      │  │  UserId (FK)          │
│  UserId (FK)       │  │  DepartmentId (FK)    │
│  AssignedBy        │  │  AssignedAt           │
│  AssignedDate      │  └───────────────────────┘
│  ReturnDate?       │
│  Notes?            │
└───────┬────────────┘
        │
┌───────┴────────────┐
│  Asset              │
│  ───────────────── │
│  AssetId (PK)      │
│  OrgId (FK)        │
│  DepartmentId?(FK) │
│  AssetName         │
│  AssetType         │
│  AssetTag?         │
│  SerialNumber?     │
│  PurchaseDate?     │
│  WarrantyEndDate?  │
│  Cost? (decimal)   │
│  Status (enum)     │
│  QrCode?           │
│  RetiredAt?        │
│  RetiredBy?        │
└───────┬────────────┘
        │
┌───────┴──────────────┐      ┌──────────────────────┐
│  MaintenanceTicket    │      │  MaintenanceLog       │
│  ──────────────────── │◄─────│  ──────────────────── │
│  TicketId (PK)        │      │  LogId (PK)           │
│  OrgId                │      │  OrgId                │
│  AssetId (FK)         │      │  TicketId (FK)        │
│  AssignmentId?        │      │  AssetId              │
│  RaisedBy             │      │  TechnicianId?        │
│  AssignedTo?          │      │  RepairDate           │
│  IssueDescription     │      │  RepairCost? (decimal)│
│  Priority (enum)      │      │  RepairNotes?         │
│  Category?            │      └───────────────────────┘
│  Status (enum)        │
│  ClosedAt?            │
└───────────────────────┘
```

### Table Summary

| Table | PK | Key Columns | Relationships |
|-------|-----|-------------|---------------|
| `Users` | `UserId` | FullName, Email, PasswordHash, Role, OrgId?, IsActive | → Organizations, ← UserDepartments, ← AssetAssignments |
| `Organizations` | `OrgId` | OrgName, Slug, OwnerId?, LogoUrl?, IsActive | ← Users, ← Departments, ← Assets, ← OrgSubscriptions |
| `Departments` | `DepartmentId` | DepartmentName, OrgId, Location? | → Organizations, ← UserDepartments |
| `UserDepartments` | `Id` | UserId, DepartmentId, OrgId, AssignedAt | → Users, → Departments |
| `Assets` | `AssetId` | AssetName, AssetType, Status, OrgId, Cost? | → Organizations, → Departments, ← AssetAssignments, ← MaintenanceTickets |
| `AssetAssignments` | `AssignmentId` | AssetId, UserId, AssignedBy, AssignedDate | → Assets, → Users |
| `MaintenanceTickets` | `TicketId` | AssetId, Priority, Status, RaisedBy, AssignedTo? | → Assets, ← MaintenanceLogs |
| `MaintenanceLogs` | `LogId` | TicketId, AssetId, RepairDate, RepairCost? | → MaintenanceTickets |
| `SubscriptionPlans` | `PlanId` | PlanName, PriceMonthly, MaxUsers?, MaxAssets? | ← OrgSubscriptions |
| `OrgSubscriptions` | `SubId` | OrgId, PlanId, BillingCycle, Status | → Organizations, → SubscriptionPlans |

---

## 12. API Endpoints

### Complete Endpoint Table

| # | Method | Endpoint | Auth | Request Body | Response |
|---|--------|----------|------|-------------|----------|
| 1 | POST | `/api/Auth/login` | No | `{ email, password, rememberMe? }` | `{ token, userId, fullName, email, role, mustChangePassword, expiresAt }` |
| 2 | POST | `/api/Auth/register` | No | `{ fullName, email, password, orgId? }` | `{ userId, fullName, email, role, token }` |
| 3 | POST | `/api/Auth/register-system-admin` | No | `{ fullName, email, password }` | `{ userId, fullName, email, role, token }` |
| 4 | POST | `/api/Auth/google` | No | `{ idToken }` | `{ userId, fullName, email, role, token, isNewUser }` |
| 5 | POST | `/api/Auth/send-verification-code` | No | `{ email }` | `{ success, message }` |
| 6 | POST | `/api/Auth/verify-code` | No | `{ email, code }` | `{ isValid, message }` |
| 7 | POST | `/api/Auth/send-welcome-email` | No | `{ email, firstName, orgName, workspaceSlug, planName }` | `{ message }` |
| 8 | POST | `/api/Auth/forgot-password` | No | `{ email }` | `{ success, message }` |
| 9 | POST | `/api/Auth/reset-password` | No | `{ email, code, newPassword }` | `{ success, message }` |
| 10 | GET | `/api/Organization` | No | — | `OrganizationDto[]` |
| 11 | POST | `/api/Organization` | No | `{ orgName, slug, timezone?, ownerId }` | `{ orgId, orgName, slug, logoUrl? }` |
| 12 | PUT | `/api/Organization/{id}` | No | `{ orgId, orgName, slug, timezone?, isActive }` | 204 No Content |
| 13 | DELETE | `/api/Organization/{id}` | No | — | 204 No Content |
| 14 | POST | `/api/Organization/{id}/logo` | No | multipart/form-data (`file`) | `{ logoUrl }` |
| 15 | GET | `/api/User` | No | `?orgId=` (optional) | `UserDto[]` |
| 16 | PUT | `/api/User/{id}` | No | `{ userId, orgId?, fullName, email, role, isActive }` | 204 No Content |
| 17 | DELETE | `/api/User/{id}` | No | — | 204 No Content |
| 18 | GET | `/api/Health` | No | — | `{ status, timestamp, database }` |

### Error Responses

| Status | Trigger | Shape |
|--------|---------|-------|
| 400 Bad Request | Validation failure, ID mismatch | `{ message }` or FluentValidation errors |
| 401 Unauthorized | Invalid credentials, bad token | `{ message }` |
| 409 Conflict | Duplicate email, duplicate slug | `{ message }` |
| 500 Internal Server Error | Server-side failure | `{ message }` |

---

## 13. Configuration

### appsettings.json Structure

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "PLACEHOLDER"
  },
  "JwtSettings": {
    "SecretKey": "PLACEHOLDER_FOR_GIT",
    "Issuer": "Fluxion",
    "Audience": "FluxionUsers",
    "ExpiryMinutes": 60
  },
  "SmtpSettings": {
    "Host": "smtp.example.com",
    "Port": 465,
    "Username": "PLACEHOLDER",
    "Password": "PLACEHOLDER",
    "EnableSsl": true,
    "FromEmail": "no-reply@fluxion.io",
    "FromName": "Fluxion"
  },
  "GoogleAuth": {
    "ClientId": "<google-client-id>"
  }
}
```

### Environment Variables (Production)

All settings are overridden via environment variables in Docker Compose / VM `.env`:

| Section | Env Variable | Example |
|---------|-------------|---------|
| Database | `ConnectionStrings__DefaultConnection` | `Server=...;Database=fluxion;User=...;Password=...` |
| JWT | `JwtSettings__SecretKey` | 256-bit secret |
| JWT | `JwtSettings__Issuer` | `Fluxion` |
| JWT | `JwtSettings__Audience` | `FluxionUsers` |
| JWT | `JwtSettings__ExpiryMinutes` | `60` |
| SMTP | `SmtpSettings__Host` | `smtp.gmail.com` |
| SMTP | `SmtpSettings__Port` | `465` |
| SMTP | `SmtpSettings__Username` | Gmail address |
| SMTP | `SmtpSettings__Password` | App password |
| SMTP | `SmtpSettings__FromEmail` | `no-reply@fluxion.io` |
| SMTP | `SmtpSettings__FromName` | `Fluxion` |
| Google | `GoogleAuth__ClientId` | OAuth 2.0 client ID |
| CORS | `AllowedOrigins__0` | Vercel user-app URL |
| CORS | `AllowedOrigins__1` | Vercel admin-app URL |

### Launch Settings (Development)

- URL: `http://localhost:5226`
- Environment: `Development`
- Swagger enabled at `/swagger`

---

## 14. Deployment & Docker

### Dockerfile (Multi-Stage Build)

```
Stage 1 — Build (sdk:8.0):
  1. Copy NuGet.Config + all .csproj files
  2. dotnet restore
  3. Copy source, clean obj/bin, dotnet publish -c Release

Stage 2 — Runtime (aspnet:8.0):
  1. Install curl (for healthcheck)
  2. Copy published output
  3. HEALTHCHECK → curl http://localhost:80/api/health
  4. EXPOSE 80
  5. ASPNETCORE_ENVIRONMENT=Production
  6. ENTRYPOINT ["dotnet", "Fluxion.API.dll"]
```

### Docker Compose

```yaml
services:
  backend:
    image: ${DOCKER_REGISTRY}/fluxion-api:${IMAGE_TAG:-latest}
    ports:
      - "127.0.0.1:5000:80"   # localhost only — nginx handles public HTTPS
    environment:
      # All config injected via env vars (see above)
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/api/health"]
      interval: 30s
      timeout: 10s
      start_period: 40s
      retries: 3
```

### Infrastructure Topology

```
Azure VM (20.2.91.234)
├── nginx (TLS termination, reverse proxy)
│   └── /api/* → http://127.0.0.1:5000
├── Docker: fluxion-backend (port 5000 internal)
└── MySQL database

Vercel
├── FrontEnd React SPA → calls https://20.2.91.234/api
└── FluxionAdminDash React SPA → calls https://20.2.91.234/api
```

### NuGet.Config

Clears all sources and uses only `nuget.org` — prevents CI issues with local/Windows-specific feeds:
```xml
<configuration>
  <packageSources>
    <clear />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" protocolVersion="3" />
  </packageSources>
</configuration>
```

---

## 15. Testing

### Test Projects

| Project | Framework | Purpose |
|---------|-----------|---------|
| `Fluxion.UnitTests` | xUnit | Unit tests for handlers, validators, services |
| `Fluxion.IntegrationTests` | xUnit | API integration tests using `WebApplicationFactory<Program>` |
| `Fluxion.SeleniumTests` | xUnit | Browser-based E2E tests |

The API project exposes `public partial class Program { }` at the bottom of [Program.cs](../BackEnd/src/Fluxion.API/Program.cs) specifically to support `WebApplicationFactory<Program>` in integration tests.

### Running Tests

```bash
# All tests
dotnet test BackEnd/Fluxion.sln

# Unit tests only
dotnet test BackEnd/tests/Fluxion.UnitTests/

# Integration tests only
dotnet test BackEnd/tests/Fluxion.IntegrationTests/
```

---

## 16. NuGet Packages

### Fluxion.API

| Package | Version | Purpose |
|---------|---------|---------|
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 8.0.13 | JWT authentication middleware |
| `Microsoft.EntityFrameworkCore.Design` | 8.0.13 | EF Core CLI tools (migrations) |
| `Swashbuckle.AspNetCore` | 6.9.0 | Swagger / OpenAPI UI |

### Fluxion.Application

| Package | Version | Purpose |
|---------|---------|---------|
| `MediatR` | 12.4.1 | CQRS mediator pattern |
| `FluentValidation` | 11.11.0 | Input validation |
| `FluentValidation.DependencyInjectionExtensions` | 11.11.0 | Auto-register validators |
| `Google.Apis.Auth` | 1.73.0 | Google ID token verification |
| `Microsoft.EntityFrameworkCore` | 8.0.13 | `DbSet<T>` for IApplicationDbContext |
| `Microsoft.Extensions.Configuration.Abstractions` | 8.0.0 | `IConfiguration` access |

### Fluxion.Infrastructure

| Package | Version | Purpose |
|---------|---------|---------|
| `BCrypt.Net-Next` | 4.1.0 | Password hashing |
| `MailKit` | 4.15.0 | SMTP email sending |
| `System.IdentityModel.Tokens.Jwt` | 8.16.0 | JWT creation/signing |
| `Microsoft.Extensions.Configuration.Abstractions` | 8.0.0 | IConfiguration |
| `Microsoft.Extensions.DependencyInjection.Abstractions` | 8.0.2 | Service registration |
| `Microsoft.Extensions.Options.ConfigurationExtensions` | 8.0.0 | Options pattern |

### Fluxion.Persistence

| Package | Version | Purpose |
|---------|---------|---------|
| `Pomelo.EntityFrameworkCore.MySql` | 8.0.3 | MySQL EF Core provider |
| `Microsoft.EntityFrameworkCore.Design` | 8.0.13 | Migration tooling |

### Fluxion.Domain

No NuGet packages — pure C# POCOs only.
