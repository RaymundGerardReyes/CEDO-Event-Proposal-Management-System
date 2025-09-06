#!/bin/bash

# Performance testing script for Event Approval Form
# Tests the 404 route response time to ensure it meets the ≤273ms target

set -e

# Default values
URL="${1:-http://localhost:3000/student-dashboard/submit-event}"
ITERATIONS="${2:-10}"
CONCURRENT="${3:-5}"

echo "🚀 Event Approval Form Performance Test"
echo "========================================"
echo "Target URL: $URL"
echo "Iterations: $ITERATIONS"
echo "Concurrent requests: $CONCURRENT"
echo "Target response time: ≤273ms"
echo ""

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "❌ Error: curl is not installed"
    exit 1
fi

# Check if the server is running
echo "🔍 Checking if server is running..."
if ! curl -s --connect-timeout 5 "$URL" > /dev/null 2>&1; then
    echo "❌ Error: Server is not responding at $URL"
    echo "   Please start the server first:"
    echo "   cd server && node server.js"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Function to test single request
test_single_request() {
    local url="$1"
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "$url")
    local status_code=$(curl -o /dev/null -s -w "%{http_code}" "$url")
    
    echo "$response_time $status_code"
}

# Function to test multiple requests
test_multiple_requests() {
    local url="$1"
    local iterations="$2"
    local results=()
    local total_time=0
    local success_count=0
    local error_count=0
    
    echo "📊 Running $iterations requests..."
    
    for i in $(seq 1 $iterations); do
        result=$(test_single_request "$url")
        response_time=$(echo "$result" | cut -d' ' -f1)
        status_code=$(echo "$result" | cut -d' ' -f2)
        
        # Convert to milliseconds
        response_time_ms=$(echo "$response_time * 1000" | bc -l)
        
        if [ "$status_code" = "404" ]; then
            results+=("$response_time_ms")
            total_time=$(echo "$total_time + $response_time_ms" | bc -l)
            success_count=$((success_count + 1))
            echo "  Request $i: ${response_time_ms}ms (404) ✅"
        else
            error_count=$((error_count + 1))
            echo "  Request $i: ${response_time_ms}ms ($status_code) ❌"
        fi
        
        # Small delay between requests
        sleep 0.1
    done
    
    echo ""
    echo "📈 Results Summary:"
    echo "  Total requests: $iterations"
    echo "  Successful (404): $success_count"
    echo "  Errors: $error_count"
    
    if [ $success_count -gt 0 ]; then
        local avg_time=$(echo "scale=2; $total_time / $success_count" | bc -l)
        echo "  Average response time: ${avg_time}ms"
        
        # Check if average meets target
        if (( $(echo "$avg_time <= 273" | bc -l) )); then
            echo "  ✅ PASS: Average response time (${avg_time}ms) meets target (≤273ms)"
        else
            echo "  ❌ FAIL: Average response time (${avg_time}ms) exceeds target (≤273ms)"
        fi
        
        # Calculate min/max
        local min_time=${results[0]}
        local max_time=${results[0]}
        for time in "${results[@]}"; do
            if (( $(echo "$time < $min_time" | bc -l) )); then
                min_time=$time
            fi
            if (( $(echo "$time > $max_time" | bc -l) )); then
                max_time=$time
            fi
        done
        
        echo "  Min response time: ${min_time}ms"
        echo "  Max response time: ${max_time}ms"
    fi
}

# Function to test concurrent requests
test_concurrent_requests() {
    local url="$1"
    local concurrent="$2"
    
    echo "🔄 Testing $concurrent concurrent requests..."
    
    local pids=()
    local temp_dir=$(mktemp -d)
    
    # Start concurrent requests
    for i in $(seq 1 $concurrent); do
        (
            result=$(test_single_request "$url")
            response_time=$(echo "$result" | cut -d' ' -f1)
            status_code=$(echo "$result" | cut -d' ' -f2)
            response_time_ms=$(echo "$response_time * 1000" | bc -l)
            echo "$response_time_ms $status_code" > "$temp_dir/result_$i"
        ) &
        pids+=($!)
    done
    
    # Wait for all requests to complete
    for pid in "${pids[@]}"; do
        wait $pid
    done
    
    # Collect results
    local total_time=0
    local success_count=0
    local error_count=0
    
    for i in $(seq 1 $concurrent); do
        if [ -f "$temp_dir/result_$i" ]; then
            result=$(cat "$temp_dir/result_$i")
            response_time_ms=$(echo "$result" | cut -d' ' -f1)
            status_code=$(echo "$result" | cut -d' ' -f2)
            
            if [ "$status_code" = "404" ]; then
                total_time=$(echo "$total_time + $response_time_ms" | bc -l)
                success_count=$((success_count + 1))
                echo "  Concurrent request $i: ${response_time_ms}ms (404) ✅"
            else
                error_count=$((error_count + 1))
                echo "  Concurrent request $i: ${response_time_ms}ms ($status_code) ❌"
            fi
        fi
    done
    
    # Cleanup
    rm -rf "$temp_dir"
    
    echo ""
    echo "📈 Concurrent Test Results:"
    echo "  Total requests: $concurrent"
    echo "  Successful (404): $success_count"
    echo "  Errors: $error_count"
    
    if [ $success_count -gt 0 ]; then
        local avg_time=$(echo "scale=2; $total_time / $success_count" | bc -l)
        echo "  Average response time: ${avg_time}ms"
        
        if (( $(echo "$avg_time <= 273" | bc -l) )); then
            echo "  ✅ PASS: Concurrent average response time (${avg_time}ms) meets target (≤273ms)"
        else
            echo "  ❌ FAIL: Concurrent average response time (${avg_time}ms) exceeds target (≤273ms)"
        fi
    fi
}

# Main execution
echo "🧪 Starting performance tests..."
echo ""

# Test 1: Single request
echo "Test 1: Single Request"
echo "----------------------"
result=$(test_single_request "$URL")
response_time=$(echo "$result" | cut -d' ' -f1)
status_code=$(echo "$result" | cut -d' ' -f2)
response_time_ms=$(echo "$response_time * 1000" | bc -l)

echo "Response time: ${response_time_ms}ms"
echo "Status code: $status_code"

if [ "$status_code" = "404" ]; then
    if (( $(echo "$response_time_ms <= 273" | bc -l) )); then
        echo "✅ PASS: Single request meets target (≤273ms)"
    else
        echo "❌ FAIL: Single request exceeds target (≤273ms)"
    fi
else
    echo "❌ FAIL: Expected 404 status code, got $status_code"
fi

echo ""

# Test 2: Multiple sequential requests
echo "Test 2: Multiple Sequential Requests"
echo "------------------------------------"
test_multiple_requests "$URL" "$ITERATIONS"

echo ""

# Test 3: Concurrent requests
echo "Test 3: Concurrent Requests"
echo "---------------------------"
test_concurrent_requests "$URL" "$CONCURRENT"

echo ""
echo "🏁 Performance testing completed!"
echo ""
echo "💡 Tips for optimization:"
echo "  - Use CDN for static 404 responses"
echo "  - Minimize middleware on 404 routes"
echo "  - Enable HTTP/2 and keep-alive"
echo "  - Consider edge caching for 404s"
