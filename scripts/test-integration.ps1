# Integration Testing Workflow for Product System (PowerShell)
# This script runs a complete integration test suite

param(
    [string]$BaseUrl = "http://localhost:3000",
    [int]$Timeout = 30000,
    [switch]$Verbose,
    [switch]$Help
)

# Test results
$script:TotalTests = 0
$script:PassedTests = 0
$script:FailedTests = 0

# Utility functions
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Test {
    param(
        [string]$TestName,
        [string]$Result,
        [string]$Details = ""
    )
    
    $script:TotalTests++
    
    if ($Result -eq "PASS") {
        $script:PassedTests++
        Write-Success $TestName
        if ($Verbose -and $Details) {
            Write-Host "   Details: $Details" -ForegroundColor Gray
        }
    } else {
        $script:FailedTests++
        Write-Error $TestName
        if ($Details) {
            Write-Host "   Details: $Details" -ForegroundColor Gray
        }
    }
}

# Check if server is running
function Test-Server {
    Write-Info "Checking if server is running at $BaseUrl..."
    
    try {
        $response = Invoke-WebRequest -Uri $BaseUrl -TimeoutSec 5 -UseBasicParsing
        Write-Success "Server is running"
        return $true
    } catch {
        Write-Error "Server is not running at $BaseUrl"
        Write-Info "Please start the development server with: npm run dev"
        return $false
    }
}

# Wait for server to be ready
function Wait-ForServer {
    Write-Info "Waiting for server to be ready..."
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "$BaseUrl/api/products" -TimeoutSec 5 -UseBasicParsing
            Write-Success "Server is ready"
            return $true
        } catch {
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 2
            $attempt++
        }
    }
    
    Write-Host ""
    Write-Error "Server did not become ready within expected time"
    return $false
}

# Run API tests
function Test-API {
    Write-Info "Running API tests..."
    
    if (Test-Path "scripts/test-api.js") {
        try {
            $result = node scripts/test-api.js --url $BaseUrl --timeout $Timeout
            if ($LASTEXITCODE -eq 0) {
                Write-Test "API Tests" "PASS"
            } else {
                Write-Test "API Tests" "FAIL" "API test script failed"
            }
        } catch {
            Write-Test "API Tests" "FAIL" "Failed to run API test script"
        }
    } else {
        Write-Warning "API test script not found, skipping API tests"
    }
}

# Run performance tests
function Test-Performance {
    Write-Info "Running performance tests..."
    
    if (Test-Path "scripts/test-performance.js") {
        try {
            $result = node scripts/test-performance.js --url $BaseUrl --concurrent 5 --duration 10000
            if ($LASTEXITCODE -eq 0) {
                Write-Test "Performance Tests" "PASS"
            } else {
                Write-Test "Performance Tests" "FAIL" "Performance test script failed"
            }
        } catch {
            Write-Test "Performance Tests" "FAIL" "Failed to run performance test script"
        }
    } else {
        Write-Warning "Performance test script not found, skipping performance tests"
    }
}

# Run component tests
function Test-Components {
    Write-Info "Running component tests..."
    
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        try {
            $result = npm test -- --testPathPattern="product-system" --passWithNoTests --watchAll=false
            if ($LASTEXITCODE -eq 0) {
                Write-Test "Component Tests" "PASS"
            } else {
                Write-Test "Component Tests" "FAIL" "Component tests failed"
            }
        } catch {
            Write-Test "Component Tests" "FAIL" "Failed to run component tests"
        }
    } else {
        Write-Warning "npm not found, skipping component tests"
    }
}

# Run linting tests
function Test-Linting {
    Write-Info "Running linting tests..."
    
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        try {
            $result = npm run lint 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Test "Linting Tests" "PASS"
            } else {
                Write-Test "Linting Tests" "FAIL" "Linting errors found"
            }
        } catch {
            Write-Test "Linting Tests" "FAIL" "Failed to run linting"
        }
    } else {
        Write-Warning "npm not found, skipping linting tests"
    }
}

# Run type checking
function Test-Types {
    Write-Info "Running type checking..."
    
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        try {
            $result = npm run type-check 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Test "Type Checking" "PASS"
            } else {
                Write-Test "Type Checking" "FAIL" "Type errors found"
            }
        } catch {
            Write-Test "Type Checking" "FAIL" "Failed to run type checking"
        }
    } else {
        Write-Warning "npm not found, skipping type checking"
    }
}

# Test database connectivity
function Test-Database {
    Write-Info "Testing database connectivity..."
    
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/products" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Test "Database Connectivity" "PASS" "Successfully connected to database"
        } else {
            Write-Test "Database Connectivity" "FAIL" "Failed to connect to database (HTTP $($response.StatusCode))"
        }
    } catch {
        Write-Test "Database Connectivity" "FAIL" "Failed to connect to database"
    }
}

# Test authentication
function Test-Authentication {
    Write-Info "Testing authentication..."
    
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/products" -Method POST -TimeoutSec 10 -UseBasicParsing
        Write-Test "Authentication" "FAIL" "Authentication not properly enforced (HTTP $($response.StatusCode))"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Test "Authentication" "PASS" "Protected endpoints require authentication"
        } else {
            Write-Test "Authentication" "FAIL" "Authentication not properly enforced"
        }
    }
}

# Test caching
function Test-Caching {
    Write-Info "Testing caching behavior..."
    
    try {
        $startTime = Get-Date
        Invoke-WebRequest -Uri "$BaseUrl/api/products" -TimeoutSec 10 -UseBasicParsing | Out-Null
        $firstRequestTime = (Get-Date) - $startTime
        
        $startTime = Get-Date
        Invoke-WebRequest -Uri "$BaseUrl/api/products" -TimeoutSec 10 -UseBasicParsing | Out-Null
        $secondRequestTime = (Get-Date) - $startTime
        
        if ($secondRequestTime.TotalMilliseconds -lt $firstRequestTime.TotalMilliseconds) {
            Write-Test "Caching" "PASS" "Second request was faster ($([math]::Round($secondRequestTime.TotalMilliseconds)) ms vs $([math]::Round($firstRequestTime.TotalMilliseconds)) ms)"
        } else {
            Write-Test "Caching" "FAIL" "Caching may not be working effectively"
        }
    } catch {
        Write-Test "Caching" "FAIL" "Failed to test caching"
    }
}

# Test error handling
function Test-ErrorHandling {
    Write-Info "Testing error handling..."
    
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/products/invalid-id" -TimeoutSec 10 -UseBasicParsing
        Write-Test "Error Handling" "FAIL" "Error handling not working properly (HTTP $($response.StatusCode))"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Test "Error Handling" "PASS" "Proper 404 error handling"
        } else {
            Write-Test "Error Handling" "FAIL" "Error handling not working properly"
        }
    }
}

# Test CORS
function Test-CORS {
    Write-Info "Testing CORS configuration..."
    
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/products" -TimeoutSec 10 -UseBasicParsing
        $corsHeaders = $response.Headers | Where-Object { $_.Key -like "*access-control*" }
        
        if ($corsHeaders) {
            Write-Test "CORS Configuration" "PASS" "CORS headers present"
        } else {
            Write-Test "CORS Configuration" "FAIL" "CORS headers missing"
        }
    } catch {
        Write-Test "CORS Configuration" "FAIL" "Failed to test CORS"
    }
}

# Generate test report
function New-TestReport {
    Write-Info "Generating test report..."
    
    $successRate = [math]::Round(($script:PassedTests * 100 / $script:TotalTests), 1)
    
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "📊 Integration Test Results"
    Write-Host "=========================================="
    Write-Host "Total Tests: $($script:TotalTests)"
    Write-Host "Passed: $($script:PassedTests)"
    Write-Host "Failed: $($script:FailedTests)"
    Write-Host "Success Rate: $successRate%"
    Write-Host "=========================================="
    
    if ($script:FailedTests -eq 0) {
        Write-Success "All tests passed! 🎉"
        return $true
    } else {
        Write-Error "$($script:FailedTests) tests failed"
        return $false
    }
}

# Main execution
function Main {
    if ($Help) {
        Write-Host "Product System Integration Testing Script (PowerShell)"
        Write-Host ""
        Write-Host "Usage: .\test-integration.ps1 [options]"
        Write-Host ""
        Write-Host "Options:"
        Write-Host "  -BaseUrl <url>      Set the API base URL (default: http://localhost:3000)"
        Write-Host "  -Timeout <ms>       Set test timeout (default: 30000ms)"
        Write-Host "  -Verbose            Enable verbose output"
        Write-Host "  -Help               Show this help message"
        Write-Host ""
        Write-Host "Examples:"
        Write-Host "  .\test-integration.ps1"
        Write-Host "  .\test-integration.ps1 -BaseUrl http://localhost:3001"
        Write-Host "  .\test-integration.ps1 -Verbose -Timeout 60000"
        return
    }
    
    Write-Host "🚀 Starting Product System Integration Tests"
    Write-Host "📍 Testing against: $BaseUrl"
    Write-Host "⏱️  Timeout: ${Timeout}ms"
    Write-Host "=========================================="
    
    # Check prerequisites
    if (-not (Test-Server)) {
        exit 1
    }
    
    # Wait for server to be ready
    if (-not (Wait-ForServer)) {
        exit 1
    }
    
    # Run all tests
    Test-Database
    Test-Authentication
    Test-Caching
    Test-ErrorHandling
    Test-CORS
    
    Test-Linting
    Test-Types
    Test-API
    Test-Performance
    Test-Components
    
    # Generate final report
    if (New-TestReport) {
        exit 0
    } else {
        exit 1
    }
}

# Run main function
Main
