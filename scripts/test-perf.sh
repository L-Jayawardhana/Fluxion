#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# Run JMeter Performance Tests
# Requires: Apache JMeter 5.x+ installed and on PATH, Backend running
# Usage:
#   ./scripts/test-perf.sh smoke       # quick single-user smoke test
#   ./scripts/test-perf.sh load        # 50-thread load test (2 min)
#   ./scripts/test-perf.sh load -JTHREADS=100 -JDURATION=300
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
source "$SCRIPT_DIR/test-utils.sh"
JMETER_DIR="$REPO_ROOT/qa/jmeter"
RESULTS_DIR="$JMETER_DIR/results"

PLAN="${1:-smoke}"
shift 2>/dev/null || true  # consume first arg, keep the rest as JMeter flags

case "$PLAN" in
  smoke) JMX="$JMETER_DIR/auth_smoke.jmx" ;;
  load)  JMX="$JMETER_DIR/auth_load.jmx"  ;;
  *)
    echo "Usage: $0 {smoke|load} [jmeter-flags]"
    exit 1
    ;;
esac

start_time=$(date +%s)
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
RESULT_FILE="$RESULTS_DIR/${PLAN}_${TIMESTAMP}.jtl"
REPORT_DIR="$RESULTS_DIR/${PLAN}_report_${TIMESTAMP}"
test_command="JMeter Performance Test ($PLAN)"

mkdir -p "$RESULTS_DIR"

echo "⚡ Running JMeter $PLAN test..."
echo "   Plan:    $JMX"
echo "   Results: $RESULT_FILE"
echo "   Report:  $REPORT_DIR"

# Capture test output
test_output=$(jmeter -n -t "$JMX" -l "$RESULT_FILE" -e -o "$REPORT_DIR" "$@" 2>&1)
test_exit_code=$?

end_time=$(date +%s)

# Determine status
if [ $test_exit_code -eq 0 ]; then
    test_status="PASSED"
else
    test_status="FAILED"
fi

# Parse JMeter results if available
if [[ -f "$RESULT_FILE" ]]; then
    # Count lines in JTL file (subtract header)
    total_requests=$(( $(wc -l < "$RESULT_FILE") - 1 ))
    failed_requests=$(awk -F',' 'NR>1 && $8=="false" {count++} END {print count+0}' "$RESULT_FILE")
    successful_requests=$((total_requests - failed_requests))
    
    test_stats=$(cat << EOF
{
  "total_requests": $total_requests,
  "successful_requests": $successful_requests,
  "failed_requests": $failed_requests,
  "success_rate": "$(echo "scale=2; $successful_requests * 100 / $total_requests" | bc -l 2>/dev/null || echo "0")%",
  "report_path": "$REPORT_DIR/index.html",
  "result_file": "$RESULT_FILE"
}
EOF
    )
else
    test_stats='{"error": "No result file generated"}'
fi

# Generate comprehensive result
generate_test_result "Performance" "$test_status" "$start_time" "$end_time" "$test_stats" "$test_command"

echo ""
echo "✅ JMeter $PLAN test complete. Results in TestResults/Performance/"
echo "   Open $REPORT_DIR/index.html for the HTML dashboard."
echo "$test_output"

exit $test_exit_code
