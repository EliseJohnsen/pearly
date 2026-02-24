# PowerShell script to run E2E tests locally
# Run this from the repository root

Write-Host "🧪 Starting E2E Test Environment..." -ForegroundColor Cyan
Write-Host ""

# Check if backend and frontend are running
$backendRunning = $false
$frontendRunning = $false

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    $backendRunning = $true
} catch {
    $backendRunning = $false
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    $frontendRunning = $true
} catch {
    $frontendRunning = $false
}

if (-not $backendRunning) {
    Write-Host "❌ Backend is not running on port 8000" -ForegroundColor Red
    Write-Host "   Please start backend:" -ForegroundColor Yellow
    Write-Host "   cd backend" -ForegroundColor Gray
    Write-Host '   $env:DATABASE_URL="postgresql://test_user:test_password@localhost:5433/pearly_test"' -ForegroundColor Gray
    Write-Host '   $env:SECRET_KEY="test-secret-key"' -ForegroundColor Gray
    Write-Host '   uvicorn app.main:app --reload --port 8000' -ForegroundColor Gray
    Write-Host ""
}

if (-not $frontendRunning) {
    Write-Host "❌ Frontend is not running on port 3000" -ForegroundColor Red
    Write-Host "   Please start frontend:" -ForegroundColor Yellow
    Write-Host "   cd frontend" -ForegroundColor Gray
    Write-Host '   $env:NEXT_PUBLIC_API_URL="http://localhost:8000"' -ForegroundColor Gray
    Write-Host '   npm run dev' -ForegroundColor Gray
    Write-Host ""
}

if (-not $backendRunning -or -not $frontendRunning) {
    Write-Host "❌ Cannot run tests - services not ready" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend is running on port 8000" -ForegroundColor Green
Write-Host "✅ Frontend is running on port 3000" -ForegroundColor Green
Write-Host ""

# Run E2E tests
Write-Host "🚀 Running Playwright E2E tests..." -ForegroundColor Cyan
Write-Host ""

Set-Location frontend

npm run test:e2e

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 View detailed report:" -ForegroundColor Cyan
    Write-Host "   npm run test:e2e:report" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "📊 View detailed report with failures:" -ForegroundColor Cyan
    Write-Host "   npm run test:e2e:report" -ForegroundColor Gray
}

Set-Location ..
