# Fluxion Admin Dashboard Selenium Tests

## Environment Variables

- `ADMIN_DASH_BASE_URL` (default: `http://localhost:5174`)
- `ADMIN_DASH_LOGIN_EMAIL` (default: `admin@fluxion.com`)
- `ADMIN_DASH_LOGIN_PASSWORD` (default: `Admin-123`)
- `SELENIUM_HEADLESS` (default: `true`)

## Run

```
dotnet test tests/Fluxion.AdminDash.SeleniumTests/Fluxion.AdminDash.SeleniumTests.csproj --logger "console;verbosity=detailed"
```

Screenshots are stored under:
`tests/Fluxion.AdminDash.SeleniumTests/bin/Debug/net8.0/TestResults/screenshots`
