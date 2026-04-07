# Raise Ticket / Report Asset Issues - QA Test Documentation

**Feature:** As a user, I want to report asset issues (raise tickets) so that repairs can be handled quickly.

**Last Updated:** April 5, 2026

---

## Table of Contents

1. [Test Coverage Overview](#test-coverage-overview)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [Running Tests](#running-tests)
5. [Test Results](#test-results)
6. [Debugging Failed Tests](#debugging-failed-tests)

---

## Test Coverage Overview

### Test Statistics

| Test Type             | Count             | Location                                                             |
| --------------------- | ----------------- | -------------------------------------------------------------------- |
| **Unit Tests**        | 18                | `tests/Fluxion.UnitTests/MaintenanceTickets/`                        |
| **Integration Tests** | 17                | `tests/Fluxion.IntegrationTests/MaintenanceTicketsEndpointsTests.cs` |
| **Total**             | **35 test cases** |                                                                      |

### Coverage Areas

✅ **Happy Path Tests** (7 tests)

- Valid ticket creation with all priority levels
- Ticket storage and retrieval
- Asset status updates
- Multi-ticket creation

✅ **Validation Tests** (15 tests)

- Empty field validation
- Max length constraints (title 200 chars, description 1000 chars)
- Whitespace-only field rejection
- Invalid asset ID handling
- Missing authorization

✅ **Error Handling** (8 tests)

- Non-existent asset rejection
- Wrong organization validation
- Retired asset handling
- Invalid priority values
- Unauthorized access

✅ **Edge Cases** (5 tests)

- Special characters in input
- Maximum valid lengths
- Multiple tickets per asset
- Timestamp accuracy

---

## Unit Tests

### Location

`tests/Fluxion.UnitTests/MaintenanceTickets/CreateMaintenanceTicketCommandValidatorTests.cs`

### Test List

#### 1.1 Valid Ticket Creation Tests

| #   | Test Name                                                     | What it tests                                       | Expected Result                          |
| --- | ------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------- |
| 1   | `Handle_ValidTicket_WithLowPriority_CreatesSuccessfully`      | Low priority ticket creation                        | ✅ Ticket created with low priority      |
| 2   | `Handle_ValidTicket_WithCriticalPriority_CreatesSuccessfully` | Critical priority ticket creation                   | ✅ Ticket created with critical priority |
| 3   | `Handle_AllPrioritiesAreHandled`                              | All 4 priority levels (Low, Medium, High, Critical) | ✅ All priorities stored correctly       |

#### 1.2 Field Validation Tests

| #   | Test Name                                    | What it tests                                         | Expected Result                 |
| --- | -------------------------------------------- | ----------------------------------------------------- | ------------------------------- |
| 4   | `Handle_EmptyTitle_ShouldStoreAsEmpty`       | Handler accepts empty title (validation at API level) | ✅ Stores empty title           |
| 5   | `Handle_VeryLongTitle_StoresCorrectly`       | Title with 200 characters                             | ✅ Stores 200-char title        |
| 6   | `Handle_VeryLongDescription_StoresCorrectly` | Description with 1000 characters                      | ✅ Stores 1000-char description |
| 7   | `Handle_NullAssetId_ThrowsException`         | Asset ID = 0                                          | ❌ Throws KeyNotFoundException  |
| 8   | `Handle_WrongOrgId_ThrowsException`          | Asset exists but in different org                     | ❌ Throws KeyNotFoundException  |

#### 1.3 Business Logic Tests

| #   | Test Name                                       | What it tests                        | Expected Result                             |
| --- | ----------------------------------------------- | ------------------------------------ | ------------------------------------------- |
| 9   | `Handle_CreatedTicket_HasCurrentTimestamp`      | Ticket creation time is captured     | ✅ Timestamp within ±1 second of now        |
| 10  | `Handle_RetiredAsset_ShouldThrowException`      | Can't raise ticket for retired asset | ❌ Throws InvalidOperationException         |
| 11  | `Handle_MultipleTicketsForSameAsset_AllCreated` | Multiple tickets for one asset       | ✅ All 3 tickets created with different IDs |
| 12  | `Handle_RaisedByUserIdStoredCorrectly`          | RaisedBy field captures user ID      | ✅ User ID persisted correctly              |

---

## Integration Tests

### Location

`tests/Fluxion.IntegrationTests/MaintenanceTicketsEndpointsTests.cs`

### Test List

#### 2.1 Happy Path Tests

| #   | Test Name                                      | What it tests                    | Expected Response   |
| --- | ---------------------------------------------- | -------------------------------- | ------------------- |
| 1   | `CreateTicket_WithValidPayload_Returns201`     | Standard ticket creation via API | ✅ HTTP 201 Created |
| 2   | `CreateTicket_WithLowPriority_Returns201`      | Low priority ticket via API      | ✅ HTTP 201 Created |
| 3   | `CreateTicket_WithCriticalPriority_Returns201` | Critical priority ticket via API | ✅ HTTP 201 Created |

#### 2.2 Validation Tests

| #   | Test Name                                                      | What it tests                            | Expected Response       |
| --- | -------------------------------------------------------------- | ---------------------------------------- | ----------------------- |
| 4   | `CreateTicket_MissingTitle_ReturnsBadRequest`                  | Empty title field                        | ❌ HTTP 400 Bad Request |
| 5   | `CreateTicket_MissingDescription_ReturnsBadRequest`            | Empty description field                  | ❌ HTTP 400 Bad Request |
| 6   | `CreateTicket_TitleExceedsMaxLength_ReturnsBadRequest`         | Title > 200 characters                   | ❌ HTTP 400 Bad Request |
| 7   | `CreateTicket_DescriptionExceedsMaxLength_ReturnsBadRequest`   | Description > 1000 characters            | ❌ HTTP 400 Bad Request |
| 8   | `CreateTicket_MaxLengthValidTitle_Returns201`                  | Title = 200 characters (boundary)        | ✅ HTTP 201 Created     |
| 9   | `CreateTicket_MaxLengthValidDescription_Returns201`            | Description = 1000 characters (boundary) | ✅ HTTP 201 Created     |
| 10  | `CreateTicket_WithWhitespaceOnlyTitle_ReturnsBadRequest`       | Title with only spaces/tabs              | ❌ HTTP 400 Bad Request |
| 11  | `CreateTicket_WithWhitespaceOnlyDescription_ReturnsBadRequest` | Description with only whitespace         | ❌ HTTP 400 Bad Request |

#### 2.3 Authorization Tests

| #   | Test Name                                      | What it tests                      | Expected Response        |
| --- | ---------------------------------------------- | ---------------------------------- | ------------------------ |
| 12  | `CreateTicket_NoAuthToken_ReturnsUnauthorized` | No Bearer token provided           | ❌ HTTP 401 Unauthorized |
| 13  | `GetTickets_WithoutAuth_ReturnsUnauthorized`   | Retrieving tickets without auth    | ❌ HTTP 401 Unauthorized |
| 14  | `GetTickets_WithAuth_ReturnsOk`                | Retrieving tickets with valid auth | ✅ HTTP 200 OK           |

#### 2.4 Error Handling Tests

| #   | Test Name                                        | What it tests                  | Expected Response     |
| --- | ------------------------------------------------ | ------------------------------ | --------------------- |
| 15  | `CreateTicket_InvalidAssetId_ReturnsNotFound`    | Asset ID doesn't exist (99999) | ❌ HTTP 404 Not Found |
| 16  | `CreateTicket_InvalidPriority_ReturnsBadRequest` | Priority out of range (99)     | ❌ HTTP 400/422       |

#### 2.5 Edge Case Tests

| #   | Test Name                                                    | What it tests                  | Expected Response           |
| --- | ------------------------------------------------------------ | ------------------------------ | --------------------------- |
| 17  | `CreateTicket_SpecialCharactersInTitle_Returns201`           | Title with !@#$%^&\*() chars   | ✅ HTTP 201 Created         |
| 18  | `CreateMultipleTickets_SameDayForDifferentAssets_AllCreated` | Three separate tickets created | ✅ All created successfully |

---

## Running Tests

### Prerequisites

```bash
# Ensure you have
- .NET 8.0 SDK installed
- Visual Studio or VS Code
- Database with test data (or use in-memory)
```

### Run All Tests

#### Option 1: PowerShell

```powershell
# Run all tests with verbose output
.\scripts\test-unit.ps1
.\scripts\test-integration.ps1

# Or directly
cd BackEnd\src
dotnet test --configuration Release --verbosity normal
```

#### Option 2: Bash

```bash
# Run all tests
./scripts/test-unit.sh
./scripts/test-integration.sh

# Or directly
cd BackEnd/src
dotnet test --configuration Release --verbosity normal
```

#### Option 3: Visual Studio

1. Open `Fluxion.sln`
2. Go to **Test Explorer** (Test → Test Explorer)
3. Click **Run All** or select specific test class
4. View results in the output pane

### Run Specific Test Suite

```bash
# Only unit tests for Raise Ticket
dotnet test tests/Fluxion.UnitTests/Fluxion.UnitTests.csproj \
  --configuration Release \
  --filter "FullyQualifiedName~MaintenanceTickets"

# Only integration tests for Raise Ticket
dotnet test tests/Fluxion.IntegrationTests/Fluxion.IntegrationTests.csproj \
  --configuration Release \
  --filter "FullyQualifiedName~MaintenanceTickets"
```

### Run Specific Test Case

```bash
# Run single test
dotnet test --filter "FullyQualifiedName~CreateMaintenanceTicketCommandValidatorTests.Handle_ValidTicket_WithLowPriority_CreatesSuccessfully"

# Run all tests with "Valid" in the name
dotnet test --filter "Name~Valid"
```

### Run with Code Coverage

```bash
# Generate coverage report
dotnet test /p:CollectCoverageMetrics=True \
  /p:CoverageThreshold=70 \
  --configuration Release

# View coverage in OpenCover or Coveralls
```

---

## Test Results

### Expected Outcomes

**For a passing QA gate:**

```
Test Run Summary
================
Total Tests: 35
Passed:      35  ✅
Failed:       0
Skipped:      0

Execution Time: ~5-10 seconds
Coverage: 85%+ on MaintenanceTickets feature
```

### Sample Test Output

```
CreateMaintenanceTicketCommandValidatorTests
  ✅ Handle_ValidTicket_WithLowPriority_CreatesSuccessfully [127ms]
  ✅ Handle_ValidTicket_WithCriticalPriority_CreatesSuccessfully [89ms]
  ✅ Handle_AllPrioritiesAreHandled [156ms]
  ✅ Handle_EmptyTitle_ShouldStoreAsEmpty [72ms]
  ✅ Handle_VeryLongTitle_StoresCorrectly [64ms]
  ... [more tests]

MaintenanceTicketsEndpointsTests
  ✅ CreateTicket_WithValidPayload_Returns201 [234ms]
  ✅ CreateTicket_WithLowPriority_Returns201 [189ms]
  ✅ CreateTicket_MissingTitle_ReturnsBadRequest [156ms]
  ... [more tests]

SUMMARY: 35 passed in 7.8s
```

---

## Debugging Failed Tests

### Issue: Test Timeout

**Symptom:** Test hangs or takes >10 seconds

**Solutions:**

1. Check if database is accessible
2. Verify in-memory database isn't bloated
3. Check for deadlocks in parallel tests

```bash
# Run tests sequentially (slower but safer)
dotnet test --test-adapter-path:. -- RunConfiguration.MaxCpuCount=1
```

### Issue: Authentication Token Invalid

**Symptom:** `GetAuthTokenAsync` returns empty string

**Solutions:**

1. Verify `/api/auth/register` endpoint works
2. Check JWT configuration in appsettings.json
3. Ensure test database has proper schema

```bash
# Test auth manually
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@test.dev","password":"Str0ng!Pass123"}'
```

### Issue: Asset Not Found in Tests

**Symptom:** `KeyNotFoundException: Asset ID 1 not found`

**Solutions:**

1. Ensure test setup creates assets with matching OrgId
2. Verify asset status isn't "retired"
3. Check in-memory database isolation between tests

```csharp
// Verify in test setup
var asset = context.Assets.Find(1);
Assert.NotNull(asset); // Debug point
```

### Issue: Validation Not Triggered

**Symptom:** Invalid data accepted when should be rejected

**Solutions:**

1. Validation happens at **validator** level (API)
2. Handler tests may not enforce validation
3. Check `CreateMaintenanceTicketCommandValidator` exists

```bash
# Find validator in codebase
grep -r "CreateMaintenanceTicketCommandValidator" BackEnd/src/
```

---

## Test Data Requirements

### Initial Setup

For tests to pass, ensure these exist in test database:

```sql
-- Organizations
INSERT INTO Organizations VALUES
  (1, 'Org One', 'org-one', NULL, NULL, true, NOW(), NOW());

-- Assets (assetIds 1-5 required for most tests)
INSERT INTO Assets VALUES
  (1, 1, 'Laptop', 'Laptop A', 'LAP001', 'SN123', 0, 'available', '{}', 1, NOW(), NOW()),
  (2, 1, 'Server', 'Server B', 'SRV001', 'SN456', 0, 'available', '{}', 1, NOW(), NOW()),
  ... (more)

-- Users (for auth tests)
INSERT INTO Users VALUES
  (1, 1, 'Test User', 'test@test.dev', '[hashed]', 'user', false, true, ...),
  ... (more)
```

**Quick Setup:**

1. Run integration tests - they auto-create data via `FluxionWebApplicationFactory`
2. Tests are isolated - each creates fresh in-memory database
3. No manual seeding required for modern test framework

---

## QA Gate Compliance

### Checklist

Before merging to `main`:

- [ ] All 35 tests pass locally
- [ ] Code coverage ≥ 70% on MaintenanceTickets feature
- [ ] No timeout issues (<10 sec per test)
- [ ] API validation working (empty fields rejected)
- [ ] Priority levels all tested
- [ ] Authorization properly enforced
- [ ] Special characters handled

### CI/CD Pipeline

These tests run automatically on:

- ✅ Pull Request to `dev`
- ✅ PR to `main`
- ✅ Scheduled nightly builds

**Pipeline Location:** `.github/workflows/dotnet-tests.yml`

---

## Additional Resources

- **Source Code:** [RaiseTicketPage.jsx](FrontEnd/Fluxion/src/pages/Maintenance/RaiseTicketPage.jsx)
- **API Endpoint:** `POST /api/maintenance-tickets`
- **Handler:** [CreateMaintenanceTicketCommandHandler.cs](BackEnd/src/Fluxion.Application/Features/MaintenanceTickets/CreateMaintenanceTicketCommandHandler.cs)
- **Feature Spec:** [See TEST_PLAN.md](TEST_PLAN.md)

---

## Performance Targets

| Metric            | Target      | Status |
| ----------------- | ----------- | ------ |
| Test Duration     | < 10s total | ✅     |
| Unit Tests        | < 5s        | ✅     |
| Integration Tests | < 10s       | ✅     |
| Code Coverage     | ≥ 70%       | ✅     |

---

**Questions?** Contact the QA team or check the TEST_PLAN.md for more details.
