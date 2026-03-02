#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# Run Fluxion Selenium Smoke Tests - Dedicated smoke test script
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
source "$SCRIPT_DIR/test-utils.sh"

start_time=$(date +%s)
test_command="Selenium Smoke Tests"
echo "🔥 Running Fluxion Smoke Tests..."

# Capture test output and run the main test script
test_output=$("$SCRIPT_DIR/test-e2e.sh" --auto-start -Dtest="*SmokeTest" "$@" 2>&1)
test_exit_code=$?

end_time=$(date +%s)

# Determine status
if [ $test_exit_code -eq 0 ]; then
    test_status="PASSED"
else
    test_status="FAILED"
fi

# Parse Maven test results
test_stats=$(parse_maven_results "$test_output")

# Generate comprehensive result
generate_test_result "Smoke" "$test_status" "$start_time" "$end_time" "$test_stats" "$test_command"

echo "🔥 Smoke tests complete. Results in TestResults/Smoke/"
echo "$test_output"

exit $test_exit_code