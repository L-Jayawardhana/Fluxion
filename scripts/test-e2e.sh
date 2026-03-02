#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# Run Fluxion Selenium Smoke Tests (Java / JUnit 5 / Maven)
# This script will check if services are running and optionally start them
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
SMOKE_DIR="$REPO_ROOT/tests/selenium-smoke"

# Defaults (override with env vars)
export SELENIUM_BASE_URL="${SELENIUM_BASE_URL:-http://localhost:5173}"
export SELENIUM_API_BASE_URL="${SELENIUM_API_BASE_URL:-http://localhost:5226/api}"
export SELENIUM_HEADLESS="${SELENIUM_HEADLESS:-true}"

# Function to check if a service is running
check_service() {
    local url=$1
    local service_name=$2
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|404\|3[0-9][0-9]"; then
        echo "✅ $service_name is running at $url"
        return 0
    else
        echo "❌ $service_name is not accessible at $url"
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    echo "⏳ Waiting for $service_name to be ready..."
    while [ $attempt -lt $max_attempts ]; do
        if check_service "$url" "$service_name" >/dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    echo "❌ $service_name failed to start within ${max_attempts} seconds"
    return 1
}

# Parse command line options
AUTO_START=false
if [[ "${1:-}" == "--auto-start" ]]; then
    AUTO_START=true
    shift
fi

echo "🌐 Preparing to run Selenium Smoke Tests (Java)..."
echo "   Frontend: $SELENIUM_BASE_URL"
echo "   Backend:  $SELENIUM_API_BASE_URL"
echo "   Headless: $SELENIUM_HEADLESS"
echo ""

# Check if services are running
frontend_running=false
backend_running=false

if check_service "$SELENIUM_BASE_URL" "Frontend"; then
    frontend_running=true
fi

if check_service "$SELENIUM_API_BASE_URL" "Backend API"; then
    backend_running=true
fi

# Start services if needed and requested
if [ "$frontend_running" = false ] || [ "$backend_running" = false ]; then
    if [ "$AUTO_START" = true ]; then
        echo ""
        echo "🚀 Auto-starting required services..."
        
        if [ "$backend_running" = false ]; then
            echo "Starting .NET Backend..."
            cd "$REPO_ROOT/BackEnd"
            nohup dotnet run --project src/Fluxion.API/Fluxion.API.csproj > /dev/null 2>&1 &
            echo $! > /tmp/fluxion-backend.pid
            wait_for_service "$SELENIUM_API_BASE_URL" "Backend API"
        fi
        
        if [ "$frontend_running" = false ]; then
            echo "Starting React Frontend..."
            cd "$REPO_ROOT/FrontEnd/Fluxion"
            nohup npm run dev > /dev/null 2>&1 &
            echo $! > /tmp/fluxion-frontend.pid
            wait_for_service "$SELENIUM_BASE_URL" "Frontend"
        fi
    else
        echo ""
        echo "❌ Required services are not running!"
        echo ""
        echo "Please start the services manually:"
        if [ "$backend_running" = false ]; then
            echo "  Backend:  cd BackEnd && dotnet run --project src/Fluxion.API/Fluxion.API.csproj"
        fi
        if [ "$frontend_running" = false ]; then
            echo "  Frontend: cd FrontEnd/Fluxion && npm run dev"
        fi
        echo ""
        echo "Or run this script with --auto-start to start them automatically:"
        echo "  $0 --auto-start"
        exit 1
    fi
fi

echo ""
echo "🧪 Running Selenium tests..."

# Change to smoke test directory and run Maven tests
cd "$SMOKE_DIR"
mvn test \
  -Dselenium.baseUrl="$SELENIUM_BASE_URL" \
  -Dselenium.apiBaseUrl="$SELENIUM_API_BASE_URL" \
  -Dselenium.headless="$SELENIUM_HEADLESS" \
  -Dselenium.screenshotDir=target/screenshots \
  --batch-mode \
  "$@"

echo ""
echo "✅ Smoke tests complete!"
echo "   Reports: tests/selenium-smoke/target/surefire-reports/"
echo "   Screenshots (on failure): tests/selenium-smoke/target/screenshots/"

# Clean up background processes if we started them
cleanup() {
    if [ "$AUTO_START" = true ]; then
        echo ""
        echo "🧹 Cleaning up background services..."
        if [ -f /tmp/fluxion-backend.pid ]; then
            kill $(cat /tmp/fluxion-backend.pid) 2>/dev/null || true
            rm /tmp/fluxion-backend.pid
        fi
        if [ -f /tmp/fluxion-frontend.pid ]; then
            kill $(cat /tmp/fluxion-frontend.pid) 2>/dev/null || true
            rm /tmp/fluxion-frontend.pid
        fi
    fi
}

# Set up cleanup on script exit
trap cleanup EXIT
