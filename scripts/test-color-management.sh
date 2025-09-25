#!/bin/bash

# Color Management Manual Testing Script
# This script provides interactive testing for the color management system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"
ADMIN_EMAIL="admin@example.com"
BUSINESS_EMAIL="business@example.com"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "info")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Function to check if server is running
check_server() {
    print_status "info" "Checking if server is running..."
    if curl -s "$BASE_URL" > /dev/null; then
        print_status "success" "Server is running at $BASE_URL"
    else
        print_status "error" "Server is not running at $BASE_URL"
        print_status "info" "Please start your Next.js server with: npm run dev"
        exit 1
    fi
}

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    print_status "info" "Testing: $description"
    
    local response
    if [ -n "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "%{http_code}" -X "$method" \
            "$BASE_URL$endpoint")
    fi
    
    local status_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$status_code" = "$expected_status" ]; then
        print_status "success" "$description - Status: $status_code"
        if [ -n "$body" ] && [ "$body" != "null" ]; then
            echo "Response: $body" | head -c 200
            echo ""
        fi
    else
        print_status "error" "$description - Expected: $expected_status, Got: $status_code"
        echo "Response: $body"
    fi
}

# Function to test color CRUD operations
test_color_crud() {
    print_status "info" "Testing Color CRUD Operations"
    echo "----------------------------------------"
    
    # Test 1: Get all colors
    test_endpoint "GET" "/api/colors" "" "200" "Get all colors"
    
    # Test 2: Create a new color
    local color_data='{
        "colorName": "Test Red",
        "hexCode": "#FF0000",
        "rgbCode": "rgb(255, 0, 0)",
        "isActive": true
    }'
    
    local create_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$color_data" \
        "$BASE_URL/api/colors")
    
    local color_id=$(echo "$create_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$color_id" ]; then
        print_status "success" "Created color with ID: $color_id"
        
        # Test 3: Get specific color
        test_endpoint "GET" "/api/colors/$color_id" "" "200" "Get specific color"
        
        # Test 4: Update color
        local update_data='{
            "colorName": "Updated Test Red",
            "isActive": false
        }'
        test_endpoint "PUT" "/api/colors/$color_id" "$update_data" "200" "Update color"
        
        # Test 5: Delete color
        test_endpoint "DELETE" "/api/colors/$color_id" "" "200" "Delete color"
    else
        print_status "error" "Failed to create color"
    fi
}

# Function to test validation
test_validation() {
    print_status "info" "Testing Validation"
    echo "----------------------------------------"
    
    # Test invalid color data
    local invalid_data='{
        "colorName": "",
        "hexCode": "#FF0000",
        "rgbCode": "rgb(255, 0, 0)"
    }'
    test_endpoint "POST" "/api/colors" "$invalid_data" "400" "Invalid color name"
    
    # Test invalid hex code
    local invalid_hex='{
        "colorName": "Invalid Hex",
        "hexCode": "FF0000",
        "rgbCode": "rgb(255, 0, 0)"
    }'
    test_endpoint "POST" "/api/colors" "$invalid_hex" "400" "Invalid hex code"
    
    # Test invalid RGB
    local invalid_rgb='{
        "colorName": "Invalid RGB",
        "hexCode": "#FF0000",
        "rgbCode": "rgb(300, 0, 0)"
    }'
    test_endpoint "POST" "/api/colors" "$invalid_rgb" "400" "Invalid RGB code"
}

# Function to test bulk operations
test_bulk_operations() {
    print_status "info" "Testing Bulk Operations"
    echo "----------------------------------------"
    
    # Test bulk create
    local bulk_data='{
        "colors": [
            {
                "colorName": "Bulk Blue",
                "hexCode": "#0000FF",
                "rgbCode": "rgb(0, 0, 255)"
            },
            {
                "colorName": "Bulk Green",
                "hexCode": "#00FF00",
                "rgbCode": "rgb(0, 255, 0)"
            }
        ]
    }'
    
    local bulk_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$bulk_data" \
        "$BASE_URL/api/colors/bulk")
    
    local created_ids=$(echo "$bulk_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$created_ids" ]; then
        print_status "success" "Bulk created colors"
        
        # Test bulk delete
        local delete_data="{\"colorIds\": [\"$(echo "$created_ids" | tr '\n' ',' | sed 's/,$//' | sed 's/,/","/g')\"]}"
        test_endpoint "DELETE" "/api/colors/bulk" "$delete_data" "200" "Bulk delete colors"
    else
        print_status "error" "Bulk create failed"
    fi
}

# Function to test frontend
test_frontend() {
    print_status "info" "Testing Frontend"
    echo "----------------------------------------"
    
    # Test admin colors page
    local admin_response=$(curl -s -w "%{http_code}" "$BASE_URL/dashboard/admin/colors")
    local admin_status="${admin_response: -3}"
    
    if [ "$admin_status" = "200" ]; then
        print_status "success" "Admin colors page loads"
    else
        print_status "error" "Admin colors page failed to load - Status: $admin_status"
    fi
    
    # Test if page contains expected elements
    local page_content=$(curl -s "$BASE_URL/dashboard/admin/colors")
    if echo "$page_content" | grep -q "Color Management"; then
        print_status "success" "Color Management component found"
    else
        print_status "warning" "Color Management component not found"
    fi
}

# Function to run interactive tests
interactive_test() {
    print_status "info" "Interactive Testing Mode"
    echo "========================================"
    
    while true; do
        echo ""
        echo "Choose a test to run:"
        echo "1) Test Color CRUD Operations"
        echo "2) Test Validation"
        echo "3) Test Bulk Operations"
        echo "4) Test Frontend"
        echo "5) Run All Tests"
        echo "6) Exit"
        echo ""
        read -p "Enter your choice (1-6): " choice
        
        case $choice in
            1)
                test_color_crud
                ;;
            2)
                test_validation
                ;;
            3)
                test_bulk_operations
                ;;
            4)
                test_frontend
                ;;
            5)
                test_color_crud
                test_validation
                test_bulk_operations
                test_frontend
                ;;
            6)
                print_status "info" "Exiting..."
                exit 0
                ;;
            *)
                print_status "error" "Invalid choice. Please enter 1-6."
                ;;
        esac
    done
}

# Function to show usage
show_usage() {
    echo "Color Management Manual Testing Script"
    echo ""
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  --interactive, -i    Run interactive testing mode"
    echo "  --crud              Test CRUD operations only"
    echo "  --validation        Test validation only"
    echo "  --bulk              Test bulk operations only"
    echo "  --frontend          Test frontend only"
    echo "  --all               Run all tests"
    echo "  --help, -h          Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  BASE_URL            Base URL for testing (default: http://localhost:3000)"
    echo "  ADMIN_EMAIL         Admin email for authentication"
    echo "  BUSINESS_EMAIL      Business owner email for authentication"
    echo ""
    echo "Examples:"
    echo "  $0 --interactive"
    echo "  $0 --all"
    echo "  BASE_URL=https://your-app.com $0 --crud"
}

# Main script
main() {
    echo "🎨 Color Management Testing Script"
    echo "=================================="
    
    # Check if server is running
    check_server
    
    # Parse command line arguments
    case "${1:-}" in
        --interactive|-i)
            interactive_test
            ;;
        --crud)
            test_color_crud
            ;;
        --validation)
            test_validation
            ;;
        --bulk)
            test_bulk_operations
            ;;
        --frontend)
            test_frontend
            ;;
        --all)
            test_color_crud
            test_validation
            test_bulk_operations
            test_frontend
            ;;
        --help|-h)
            show_usage
            ;;
        "")
            print_status "info" "No option specified. Running interactive mode..."
            interactive_test
            ;;
        *)
            print_status "error" "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
