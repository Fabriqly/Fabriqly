#!/bin/bash

# Integration Testing Workflow for Product System
# This script runs a complete integration test suite

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${API_BASE_URL:-"http://localhost:3000"}
TEST_TIMEOUT=${TEST_TIMEOUT:-30000}
VERBOSE=${VERBOSE:-false}

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Utility functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_test() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        log_success "$test_name"
        if [ "$VERBOSE" = "true" ] && [ -n "$details" ]; then
            echo "   Details: $details"
        fi
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        log_error "$test_name"
        if [ -n "$details" ]; then
            echo "   Details: $details"
        fi
    fi
}

# Check if server is running
check_server() {
    log_info "Checking if server is running at $BASE_URL..."
    
    if curl -s --connect-timeout 5 "$BASE_URL" > /dev/null 2>&1; then
        log_success "Server is running"
        return 0
    else
        log_error "Server is not running at $BASE_URL"
        log_info "Please start the development server with: npm run dev"
        return 1
    fi
}

# Wait for server to be ready
wait_for_server() {
    log_info "Waiting for server to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s --connect-timeout 5 "$BASE_URL/api/products" > /dev/null 2>&1; then
            log_success "Server is ready"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "Server did not become ready within expected time"
    return 1
}

# Run API tests
run_api_tests() {
    log_info "Running API tests..."
    
    if [ -f "scripts/test-api.js" ]; then
        if node scripts/test-api.js --url "$BASE_URL" --timeout "$TEST_TIMEOUT"; then
            log_test "API Tests" "PASS"
        else
            log_test "API Tests" "FAIL" "API test script failed"
        fi
    else
        log_warning "API test script not found, skipping API tests"
    fi
}

# Run performance tests
run_performance_tests() {
    log_info "Running performance tests..."
    
    if [ -f "scripts/test-performance.js" ]; then
        if node scripts/test-performance.js --url "$BASE_URL" --concurrent 5 --duration 10000; then
            log_test "Performance Tests" "PASS"
        else
            log_test "Performance Tests" "FAIL" "Performance test script failed"
        fi
    else
        log_warning "Performance test script not found, skipping performance tests"
    fi
}

# Run component tests
run_component_tests() {
    log_info "Running component tests..."
    
    if command -v npm > /dev/null 2>&1; then
        if npm test -- --testPathPattern="product-system" --passWithNoTests --watchAll=false; then
            log_test "Component Tests" "PASS"
        else
            log_test "Component Tests" "FAIL" "Component tests failed"
        fi
    else
        log_warning "npm not found, skipping component tests"
    fi
}

# Run linting tests
run_linting_tests() {
    log_info "Running linting tests..."
    
    if command -v npm > /dev/null 2>&1; then
        if npm run lint > /dev/null 2>&1; then
            log_test "Linting Tests" "PASS"
        else
            log_test "Linting Tests" "FAIL" "Linting errors found"
        fi
    else
        log_warning "npm not found, skipping linting tests"
    fi
}

# Run type checking
run_type_checking() {
    log_info "Running type checking..."
    
    if command -v npm > /dev/null 2>&1; then
        if npm run type-check > /dev/null 2>&1; then
            log_test "Type Checking" "PASS"
        else
            log_test "Type Checking" "FAIL" "Type errors found"
        fi
    else
        log_warning "npm not found, skipping type checking"
    fi
}

# Test database connectivity
test_database_connectivity() {
    log_info "Testing database connectivity..."
    
    # Test if we can fetch products (indicates database is working)
    local response=$(curl -s --connect-timeout 10 "$BASE_URL/api/products" 2>/dev/null)
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$BASE_URL/api/products" 2>/dev/null)
    
    if [ "$status_code" = "200" ]; then
        log_test "Database Connectivity" "PASS" "Successfully connected to database"
    else
        log_test "Database Connectivity" "FAIL" "Failed to connect to database (HTTP $status_code)"
    fi
}

# Test authentication
test_authentication() {
    log_info "Testing authentication..."
    
    # Test protected endpoint without auth
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$BASE_URL/api/products" -X POST 2>/dev/null)
    
    if [ "$status_code" = "401" ]; then
        log_test "Authentication" "PASS" "Protected endpoints require authentication"
    else
        log_test "Authentication" "FAIL" "Authentication not properly enforced (HTTP $status_code)"
    fi
}

# Test caching
test_caching() {
    log_info "Testing caching behavior..."
    
    # Make two requests and measure response times
    local start_time=$(date +%s%3N)
    curl -s --connect-timeout 10 "$BASE_URL/api/products" > /dev/null 2>&1
    local first_request_time=$(($(date +%s%3N) - start_time))
    
    local start_time=$(date +%s%3N)
    curl -s --connect-timeout 10 "$BASE_URL/api/products" > /dev/null 2>&1
    local second_request_time=$(($(date +%s%3N) - start_time))
    
    if [ $second_request_time -lt $first_request_time ]; then
        log_test "Caching" "PASS" "Second request was faster ($second_request_time ms vs $first_request_time ms)"
    else
        log_test "Caching" "FAIL" "Caching may not be working effectively"
    fi
}

# Test error handling
test_error_handling() {
    log_info "Testing error handling..."
    
    # Test 404 error
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$BASE_URL/api/products/invalid-id" 2>/dev/null)
    
    if [ "$status_code" = "404" ]; then
        log_test "Error Handling" "PASS" "Proper 404 error handling"
    else
        log_test "Error Handling" "FAIL" "Error handling not working properly (HTTP $status_code)"
    fi
}

# Test CORS
test_cors() {
    log_info "Testing CORS configuration..."
    
    local cors_headers=$(curl -s -I --connect-timeout 10 "$BASE_URL/api/products" 2>/dev/null | grep -i "access-control" || echo "")
    
    if [ -n "$cors_headers" ]; then
        log_test "CORS Configuration" "PASS" "CORS headers present"
    else
        log_test "CORS Configuration" "FAIL" "CORS headers missing"
    fi
}

# Generate test report
generate_report() {
    log_info "Generating test report..."
    
    local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    
    echo ""
    echo "=========================================="
    echo "📊 Integration Test Results"
    echo "=========================================="
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Success Rate: $success_rate%"
    echo "=========================================="
    
    if [ $FAILED_TESTS -eq 0 ]; then
        log_success "All tests passed! 🎉"
        return 0
    else
        log_error "$FAILED_TESTS tests failed"
        return 1
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    # Add any cleanup tasks here
}

# Main execution
main() {
    echo "🚀 Starting Product System Integration Tests"
    echo "📍 Testing against: $BASE_URL"
    echo "⏱️  Timeout: ${TEST_TIMEOUT}ms"
    echo "=========================================="
    
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Check prerequisites
    if ! check_server; then
        exit 1
    fi
    
    # Wait for server to be ready
    if ! wait_for_server; then
        exit 1
    fi
    
    # Run all tests
    test_database_connectivity
    test_authentication
    test_caching
    test_error_handling
    test_cors
    
    run_linting_tests
    run_type_checking
    run_api_tests
    run_performance_tests
    run_component_tests
    
    # Generate final report
    if generate_report; then
        exit 0
    else
        exit 1
    fi
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            BASE_URL="$2"
            shift 2
            ;;
        --timeout)
            TEST_TIMEOUT="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE="true"
            shift
            ;;
        --help|-h)
            echo "Product System Integration Testing Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --url <url>         Set the API base URL (default: http://localhost:3000)"
            echo "  --timeout <ms>      Set test timeout (default: 30000ms)"
            echo "  --verbose           Enable verbose output"
            echo "  --help, -h          Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  API_BASE_URL        Set the API base URL"
            echo "  TEST_TIMEOUT        Set test timeout"
            echo "  VERBOSE             Enable verbose output"
            echo ""
            echo "Examples:"
            echo "  $0"
            echo "  $0 --url http://localhost:3001"
            echo "  $0 --verbose --timeout 60000"
            echo "  API_BASE_URL=http://staging.example.com $0"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"
