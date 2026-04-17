# Subscription Management Feature

## Overview
Replaced the default unbounded organization limit setup with a tiered Subscription Management system allowing enforcing plan upgrades/downgrades gracefully, keeping a track of database resource footprints (Users and Assets) to map to billing capabilities.

## Tier Definitions
- **Free**: Max 5 active users, 50 assets.
- **Pro**: Max 25 active users, 500 assets.
- **Enterprise**: Unlimited limits.

## Database Entities
- `SubscriptionPlans`: Maps fixed metadata config properties of tiers in the system.
- `OrgSubscriptions`: Pivot table tracking Organization's currently active modeled plan history and current configuration.

## Features Enforced

1. **Limit Checking**
   - Handlers `CreateEmployeeCommandHandler` and `CreateAssetCommandHandler` hook directly into limit checks over an organization's active plan. Throws descriptive UI alerts (`409 Conflict` converted automatically by Controller) if resources max out.
   - Example UI handling: "You have reached the maximum allowed limit of 5 users for your Free plan".
   
2. **Settings Hub Configuration**
   - Re-wrote the primary `SettingsPage.jsx` workspace tab allowing the primary client (`owner`/`admin`) to downgrade and upgrade their plans through Mediatr controllers.

3. **Validation & Extensibility**
   - Downgrading is automatically shielded dynamically in EF Core (`UpdateOrganizationPlanHandler.cs`). If the target downgrade limits conflict against currently instantiated DB structures physically present in the system, exceptions accurately map out precisely how many users or assets the administrator must manually purge to clear the threshold for downgrade effectively preventing cascading deletion operations from unintentionally crippling production data.

4. **Payment Verification & Validation**
   - Premium tiers (`Pro`, `Enterprise`) enforce client-side payment verification dialogs upon selection, both during initial organization creation, and during post-creation upgrades inside the `Settings` portal.
   - The Custom `PaymentModal` interface enforces structural parity on card validation fields: Card number validation (16 digits), temporal boundary checking against past expiration dates (`MM/YY`), and basic CVV pattern checks.
   - In frontend testing, an intentional simulated bank failure overrides API execution if the CVV inputted matches `000`. Free plans natively skip payment simulation routing immediately.
