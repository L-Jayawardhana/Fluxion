#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# Run All Fluxion Tests and Generate Dashboard
# Executes all test types in sequence and generates a comprehensive report
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Running All Fluxion Tests"
echo "═══════════════════════════════════════════════════════════════════════"

# Track overall results
overall_start=$(date +%s)
failed_tests=()
passed_tests=()

run_test() {
    local test_name="$1"
    local script_path="$2"
    
    echo ""
    echo "📋 Running $test_name Tests..."
    echo "───────────────────────────────────────────────────────────────────────"
    
    if bash "$script_path"; then
        passed_tests+=("$test_name")
        echo "✅ $test_name Tests: PASSED"
    else
        failed_tests+=("$test_name")
        echo "❌ $test_name Tests: FAILED"
    fi
}

# Run all test types
run_test "Unit" "$SCRIPT_DIR/test-unit.sh"
run_test "Integration" "$SCRIPT_DIR/test-integration.sh"
run_test "Smoke" "$SCRIPT_DIR/test-smoke.sh"

# Skip performance tests by default, enable with --include-perf
if [[ "${1:-}" == "--include-perf" ]]; then
    run_test "Performance" "$SCRIPT_DIR/test-perf.sh smoke"
fi

overall_end=$(date +%s)
overall_duration=$((overall_end - overall_start))

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "🏁 All Tests Complete"
echo "═══════════════════════════════════════════════════════════════════════"
echo "⏱️  Total Duration: ${overall_duration}s"
echo ""

# Summary
if [[ ${#passed_tests[@]} -gt 0 ]]; then
    echo "✅ Passed Tests:"
    for test in "${passed_tests[@]}"; do
        echo "   - $test"
    done
fi

if [[ ${#failed_tests[@]} -gt 0 ]]; then
    echo ""
    echo "❌ Failed Tests:"
    for test in "${failed_tests[@]}"; do
        echo "   - $test"
    done
fi

echo ""
echo "📊 Generating Test Dashboard..."
bash "$SCRIPT_DIR/generate-dashboard.sh"

echo ""
echo "🎉 Test suite complete!"
echo "📋 View results: TestResults/test-dashboard.md"

# Exit with error if any tests failed
if [[ ${#failed_tests[@]} -gt 0 ]]; then
    exit 1
else
    exit 0
fi