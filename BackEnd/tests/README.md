# Backend Tests

This directory contains all **.NET automated tests** for the Fluxion backend API, organized as sibling projects to `src/`.

```
BackEnd/
├── src/                                    # Production source code
│   ├── Fluxion.API/
│   ├── Fluxion.Application/
│   ├── Fluxion.Domain/
│   ├── Fluxion.Infrastructure/
│   └── Fluxion.Persistence/
├── tests/                                  # ← You are here
│   ├── Fluxion.UnitTests/                  # Fast, isolated unit tests
│   └── Fluxion.IntegrationTests/           # Full HTTP pipeline tests
└── Fluxion.sln                             # Solution includes both src/ and tests/
```

---

## Test Projects

### Fluxion.UnitTests

**Framework:** xUnit 2.9 + Moq 4.20 + FluentAssertions 6.12  
**Database:** EF Core InMemory (no external dependencies)  
**Total Tests:** 123

Tests individual handlers, validators, services, and controllers in isolation using mocked dependencies.

| Folder | What it tests | Key files |
|--------|--------------|-----------|
| `Authentication/` | Login & Register command handlers + validators | `LoginCommandHandlerTests.cs`, `RegisterCommandValidatorTests.cs` |
| `Controllers/` | Maintenance, Notification, Technician controllers | `MaintenanceControllerTests.cs`, `TechnicianControllerTests.cs` |
| `Departments/` | Department CRUD handlers (create, update, toggle, duplicates) | `DepartmentHandlerTests.cs` |
| `MaintenanceLogs/` | Financial insights + maintenance log page queries | `GetFinancialInsightsQueryHandlerTests.cs` |
| `MaintenanceTickets/` | Ticket creation, assignment, filtering, pagination | `AssignMaintenanceTicketCommandHandlerTests.cs` |
| `Organizations/` | Plan switching, limit enforcement (asset/user caps) | `OrganizationPlanHandlerTests.cs` |
| `Services/` | JWT token generation, password hashing, email alerts | `JwtTokenServiceTests.cs`, `PasswordHasherTests.cs` |
| `Users/` | Employee creation with role-based department rules | `CreateEmployeeCommandHandlerTests.cs` |
| `Infrastructure/` | Background job services | `MaintenanceTicketGeneratorServiceTests.cs` |
| `Builders/` | Test data builders (Builder pattern) | `UserBuilder.cs` |
| `Helpers/` | Shared InMemory DbContext factory | `InMemoryDbContextFactory.cs` |

### Fluxion.IntegrationTests

**Framework:** xUnit 2.9 + `WebApplicationFactory<Program>` + FluentAssertions  
**Database:** EF Core InMemory (swapped in via `FluxionWebApplicationFactory`)  
**Total Tests:** 35

Spins up the full ASP.NET Core pipeline in-memory and sends real HTTP requests through the middleware stack.

| File | Endpoints tested |
|------|-----------------|
| `AuthEndpointsTests.cs` | `/api/auth/login`, `/api/auth/register`, full auth flow |
| `DepartmentEndpointsTests.cs` | `/api/departments` — CRUD, role-scoped access |
| `MaintenanceEndpointsTests.cs` | `/api/maintenance` — log queries, financial insights |
| `MaintenanceTicketsEndpointsTests.cs` | `/api/maintenance-tickets` — create, assign, filter |
| `TechnicianEndpointsTests.cs` | `/api/technician` — dashboard, repair logging, assets |
| `FluxionWebApplicationFactory.cs` | Custom `WebApplicationFactory` — replaces MySQL with InMemory DB |

---

## Running Tests

### Quick Start

```bash
# Run unit tests only (fast — ~3 seconds)
dotnet test BackEnd/tests/Fluxion.UnitTests/ --configuration Release

# Run integration tests only
dotnet test BackEnd/tests/Fluxion.IntegrationTests/ --configuration Release

# Run all backend tests via solution
dotnet test BackEnd/Fluxion.sln --configuration Release
```

### Using Scripts

```bash
# Bash
./scripts/test-unit.sh
./scripts/test-integration.sh

# PowerShell
.\scripts\test-unit.ps1
.\scripts\test-integration.ps1
```

### With Coverage

```bash
dotnet test BackEnd/tests/Fluxion.UnitTests/ \
  --configuration Release \
  --collect:"XPlat Code Coverage" \
  --results-directory TestResults/Unit
```

Coverage reports (Cobertura XML) are saved to `TestResults/Unit/`.

---

## Writing New Tests

### Unit Test Template

```csharp
using FluentAssertions;
using Moq;

namespace Fluxion.UnitTests.YourFeature;

public class YourHandlerTests
{
    private readonly Mock<IYourDependency> _mockDep = new();

    [Fact]
    public async Task Handle_ValidInput_ReturnsExpectedResult()
    {
        // Arrange
        _mockDep.Setup(x => x.GetAsync(It.IsAny<int>()))
                .ReturnsAsync(new YourEntity());

        var handler = new YourHandler(_mockDep.Object);

        // Act
        var result = await handler.Handle(new YourCommand(), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        _mockDep.Verify(x => x.GetAsync(It.IsAny<int>()), Times.Once);
    }
}
```

### Integration Test Template

```csharp
namespace Fluxion.IntegrationTests;

public class YourEndpointTests : IClassFixture<FluxionWebApplicationFactory>
{
    private readonly HttpClient _client;

    public YourEndpointTests(FluxionWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Get_ReturnsSuccess()
    {
        var response = await _client.GetAsync("/api/your-endpoint");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
```

### Conventions

- **Naming:** `{MethodUnderTest}_{Scenario}_{ExpectedBehavior}` — e.g. `Handle_DuplicateEmail_ThrowsInvalidOperation`
- **One assert per test** where practical
- **Use Builders** (`Builders/UserBuilder.cs`) for complex test data setup
- **Use InMemoryDbContextFactory** (`Helpers/`) when testing handlers that need a DbContext

---

## Architecture

```
┌─────────────────────────────────┐
│     Fluxion.UnitTests           │
│  (mocks everything, fast)       │
│         ↓ references            │
│  Domain, Application,           │
│  Infrastructure, Persistence,   │
│  API                            │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   Fluxion.IntegrationTests      │
│  (full HTTP pipeline)           │
│         ↓ references            │
│  Fluxion.API                    │
│  (via WebApplicationFactory)    │
└─────────────────────────────────┘
```

---

## CI/CD

Tests run automatically on every push/PR to `main` via GitHub Actions (`.github/workflows/cicd.yml`):

| Step | Duration | Fail Policy |
|------|----------|-------------|
| Unit Tests | ~3s | `continue-on-error: true` (temporary) |
| Integration Tests | ~2s | `continue-on-error: true` (temporary) |

> **Note:** `continue-on-error` will be removed once all tests are fully stabilized.

---

## Related

| Resource | Path |
|----------|------|
| QA shared layer | [`qa/`](../../qa/) |
| Test runner scripts | [`scripts/`](../../scripts/) |
| Full test plan | [`TEST_PLAN.md`](../../TEST_PLAN.md) |
| CI/CD workflow | [`.github/workflows/cicd.yml`](../../.github/workflows/cicd.yml) |
