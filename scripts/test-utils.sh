#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# Shared Test Utilities for Result Generation
# ──────────────────────────────────────────────────────────────────────

# Generate comprehensive test result file
generate_test_result() {
    local test_type="$1"
    local test_status="$2"
    local start_time="$3"
    local end_time="$4"
    local details="$5"
    local test_command="$6"
    
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local duration=$((end_time - start_time))
    local result_dir="/home/lakdinu/projects/dotnet/Fluxion/TestResults/${test_type}"
    local result_file="${result_dir}/test-result.json"
    local summary_file="${result_dir}/test-summary.md"
    
    # Create JSON result
    cat > "$result_file" << EOF
{
  "testType": "$test_type",
  "timestamp": "$timestamp",
  "status": "$test_status",
  "duration": "${duration}s",
  "startTime": "$(date -d @$start_time '+%Y-%m-%d %H:%M:%S')",
  "endTime": "$(date -d @$end_time '+%Y-%m-%d %H:%M:%S')",
  "command": "$test_command",
  "details": $details
}
EOF

    # Create Markdown summary
    cat > "$summary_file" << EOF
# $test_type Test Results

## Summary
- **Status**: $test_status
- **Timestamp**: $timestamp  
- **Duration**: ${duration} seconds
- **Command**: \`$test_command\`

## Details
$details

---
*Generated automatically by Fluxion test suite*
EOF

    echo "📊 Test results saved:"
    echo "   JSON: $result_file"
    echo "   Summary: $summary_file"
}

# Parse dotnet test output to extract statistics
parse_dotnet_results() {
    local output="$1"
    local passed=$(echo "$output" | grep -oP "Passed!\s*-\s*Failed:\s*\K\d+" | head -1 || echo "0")
    local failed=$(echo "$output" | grep -oP "Failed:\s*\K\d+" | head -1 || echo "0") 
    local skipped=$(echo "$output" | grep -oP "Skipped:\s*\K\d+" | head -1 || echo "0")
    local total=$(echo "$output" | grep -oP "Total:\s*\K\d+" | head -1 || echo "0")
    
    # Alternative parsing if the above doesn't work
    if [[ "$total" == "0" ]]; then
        passed=$(echo "$output" | grep -oP "Passed:\s*\K\d+" | tail -1 || echo "0")
        failed=$(echo "$output" | grep -oP "Failed:\s*\K\d+" | tail -1 || echo "0") 
        skipped=$(echo "$output" | grep -oP "Skipped:\s*\K\d+" | tail -1 || echo "0")
        total=$((passed + failed + skipped))
    fi
    
    cat << EOF
{
  "total": $total,
  "passed": $passed,
  "failed": $failed,
  "skipped": $skipped,
  "success_rate": "$(echo "scale=2; $passed * 100 / $total" | bc -l 2>/dev/null || echo "0")%"
}
EOF
}

# Parse Maven test output for Selenium tests
parse_maven_results() {
    local output="$1"
    local tests_run=$(echo "$output" | grep -oP "Tests run:\s*\K\d+" | tail -1 || echo "0")
    local failures=$(echo "$output" | grep -oP "Failures:\s*\K\d+" | tail -1 || echo "0")
    local errors=$(echo "$output" | grep -oP "Errors:\s*\K\d+" | tail -1 || echo "0")
    local skipped=$(echo "$output" | grep -oP "Skipped:\s*\K\d+" | tail -1 || echo "0")
    local passed=$((tests_run - failures - errors))
    
    cat << EOF
{
  "total": $tests_run,
  "passed": $passed,
  "failed": $((failures + errors)),
  "skipped": $skipped,
  "failures": $failures,
  "errors": $errors,
  "success_rate": "$(echo "scale=2; $passed * 100 / $tests_run" | bc -l 2>/dev/null || echo "0")%"
}
EOF
}

# Check if bc is available, install if needed
ensure_bc() {
    if ! command -v bc &> /dev/null; then
        echo "Installing bc for calculations..."
        sudo pacman -S --noconfirm bc 2>/dev/null || echo "Please install 'bc' package manually"
    fi
}

# Initialize bc
ensure_bc