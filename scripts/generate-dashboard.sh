#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# Generate Test Results Dashboard
# Consolidates all test results into a comprehensive overview
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
RESULTS_ROOT="$REPO_ROOT/TestResults"

generate_dashboard() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local dashboard_file="$RESULTS_ROOT/test-dashboard.md"
    
    cat > "$dashboard_file" << 'EOF'
# 📊 Fluxion Test Results Dashboard

## Overview
This dashboard provides a comprehensive view of all test results across different test types.

EOF

    echo "Generated at: $timestamp" >> "$dashboard_file"
    echo "" >> "$dashboard_file"

    # Test Types
    local test_types=("Unit" "Integration" "Smoke" "Performance")
    
    for test_type in "${test_types[@]}"; do
        local result_dir="$RESULTS_ROOT/$test_type"
        local result_file="$result_dir/test-result.json"
        
        echo "## $test_type Tests" >> "$dashboard_file"
        
        if [[ -f "$result_file" ]]; then
            # Extract key information from JSON
            local status=$(jq -r '.status // "UNKNOWN"' "$result_file" 2>/dev/null || echo "UNKNOWN")
            local timestamp_test=$(jq -r '.timestamp // "N/A"' "$result_file" 2>/dev/null || echo "N/A")
            local duration=$(jq -r '.duration // "N/A"' "$result_file" 2>/dev/null || echo "N/A")
            
            # Status emoji
            local status_emoji=""
            case "$status" in
                "PASSED") status_emoji="✅" ;;
                "FAILED") status_emoji="❌" ;;
                *) status_emoji="⚠️" ;;
            esac
            
            cat >> "$dashboard_file" << EOF

- **Status**: $status_emoji $status
- **Last Run**: $timestamp_test
- **Duration**: $duration
- **Details**: [JSON Report](${test_type}/test-result.json) | [Summary](${test_type}/test-summary.md)

EOF
            
            # Add test-specific statistics if available
            if [[ "$test_type" == "Unit" || "$test_type" == "Integration" ]]; then
                local passed=$(jq -r '.details.passed // 0' "$result_file" 2>/dev/null || echo "0")
                local failed=$(jq -r '.details.failed // 0' "$result_file" 2>/dev/null || echo "0")
                local total=$(jq -r '.details.total // 0' "$result_file" 2>/dev/null || echo "0")
                local success_rate=$(jq -r '.details.success_rate // "0%"' "$result_file" 2>/dev/null || echo "0%")
                
                cat >> "$dashboard_file" << EOF
  - **Tests**: $passed passed, $failed failed (Total: $total)
  - **Success Rate**: $success_rate

EOF
            elif [[ "$test_type" == "Smoke" ]]; then
                local passed=$(jq -r '.details.passed // 0' "$result_file" 2>/dev/null || echo "0")
                local failed=$(jq -r '.details.failed // 0' "$result_file" 2>/dev/null || echo "0")
                local total=$(jq -r '.details.total // 0' "$result_file" 2>/dev/null || echo "0")
                
                cat >> "$dashboard_file" << EOF
  - **Tests**: $passed passed, $failed failed (Total: $total)

EOF
            elif [[ "$test_type" == "Performance" ]]; then
                local total_requests=$(jq -r '.details.total_requests // 0' "$result_file" 2>/dev/null || echo "0")
                local successful_requests=$(jq -r '.details.successful_requests // 0' "$result_file" 2>/dev/null || echo "0")
                local success_rate=$(jq -r '.details.success_rate // "0%"' "$result_file" 2>/dev/null || echo "0%")
                
                cat >> "$dashboard_file" << EOF
  - **Requests**: $successful_requests successful, $total_requests total
  - **Success Rate**: $success_rate

EOF
            fi
        else
            cat >> "$dashboard_file" << EOF

- **Status**: ⚪ Not Run
- **Last Run**: Never
- **Note**: No test results available

EOF
        fi
    done
    
    # Footer
    cat >> "$dashboard_file" << EOF

---

## How to Run Tests

### Unit Tests
\`\`\`bash
./scripts/test-unit.sh
\`\`\`

### Integration Tests
\`\`\`bash
./scripts/test-integration.sh
\`\`\`

### Smoke Tests
\`\`\`bash
./scripts/test-smoke.sh
\`\`\`

### Performance Tests
\`\`\`bash
./scripts/test-perf.sh smoke    # Quick smoke test
./scripts/test-perf.sh load     # Load test
\`\`\`

### All Tests
\`\`\`bash
./scripts/run-all-tests.sh
\`\`\`

---

*Dashboard generated automatically by Fluxion test suite*
*Last updated: $timestamp*
EOF

    echo "📊 Test dashboard generated: $dashboard_file"
}

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "Installing jq for JSON parsing..."
    sudo pacman -S --noconfirm jq 2>/dev/null || echo "Please install 'jq' package manually"
fi

generate_dashboard