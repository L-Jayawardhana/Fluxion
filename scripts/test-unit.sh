#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# Run Fluxion .NET Unit Tests
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
source "$SCRIPT_DIR/test-utils.sh"

start_time=$(date +%s)
test_command="dotnet test Unit Tests"
echo "🧪 Running Unit Tests..."

# Capture test output
test_output=$(dotnet test "$REPO_ROOT/BackEnd/tests/Fluxion.UnitTests/Fluxion.UnitTests.csproj" \
  --configuration Release \
  --logger "console;verbosity=normal" \
  --logger "trx;LogFileName=unit-tests.trx" \
  --collect:"XPlat Code Coverage" \
  --results-directory "$REPO_ROOT/TestResults/Unit" \
  "$@" 2>&1)

end_time=$(date +%s)
test_exit_code=$?

# Determine status
if [ $test_exit_code -eq 0 ]; then
    test_status="PASSED"
else
    test_status="FAILED"
fi

# Parse test results
test_stats=$(parse_dotnet_results "$test_output")

# Generate comprehensive result
generate_test_result "Unit" "$test_status" "$start_time" "$end_time" "$test_stats" "$test_command"

echo "✅ Unit tests complete. Results in TestResults/Unit/"
echo "$test_output"

exit $test_exit_code
