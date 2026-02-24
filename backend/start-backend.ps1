# Start backend server script
# This ensures only one instance is running

Write-Host "Checking for existing backend processes..." -ForegroundColor Cyan

# Kill any existing processes on port 8000
$connections = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($connections) {
    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    Write-Host "Found $($processIds.Count) existing process(es). Stopping them..." -ForegroundColor Yellow
    foreach ($processId in $processIds) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

Write-Host "Activating virtual environment..." -ForegroundColor Cyan
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    & .\venv\Scripts\Activate.ps1
    Write-Host "Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "WARNING: Virtual environment not found. Using global Python." -ForegroundColor Yellow
}

Write-Host "Starting backend server..." -ForegroundColor Green
Write-Host "Backend will be available at http://localhost:8000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
