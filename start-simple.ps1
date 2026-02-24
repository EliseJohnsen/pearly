# Simple start script for Perle (Windows, no debugger)
# Starts frontend (npm run dev) and backend (uvicorn)

$ErrorActionPreference = "Stop"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND_DIR = Join-Path $SCRIPT_DIR "backend"
$FRONTEND_DIR = Join-Path $SCRIPT_DIR "frontend"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "Starting Perle (Simple Mode)" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

# Clean up any existing processes first
Write-Host "`nCleaning up any existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*$FRONTEND_DIR*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*uvicorn*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Cleanup function
function Cleanup {
    Write-Host "`nShutting down services..." -ForegroundColor Yellow
    if ($FRONTEND_JOB) {
        Write-Host "Stopping frontend..." -ForegroundColor Yellow
        Stop-Job $FRONTEND_JOB -ErrorAction SilentlyContinue
        Remove-Job $FRONTEND_JOB -Force -ErrorAction SilentlyContinue
    }
    if ($BACKEND_JOB) {
        Write-Host "Stopping backend..." -ForegroundColor Yellow
        Stop-Job $BACKEND_JOB -ErrorAction SilentlyContinue
        Remove-Job $BACKEND_JOB -Force -ErrorAction SilentlyContinue
    }
    # Kill any remaining processes on ports
    Get-NetTCPConnection -LocalPort 3000,8000 -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique |
        ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}

# Register cleanup on exit
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Cleanup } | Out-Null

# Handle Ctrl+C
$null = [Console]::TreatControlCAsInput = $false
try {
    # Start frontend
    Write-Host "`n[1/2] Starting Frontend (npm run dev)..." -ForegroundColor Green
    Push-Location $FRONTEND_DIR
    $FRONTEND_JOB = Start-Job -ScriptBlock {
        Set-Location $using:FRONTEND_DIR
        npm run dev 2>&1 | Out-File "$using:SCRIPT_DIR\frontend.log" -Encoding UTF8
    }
    Pop-Location
    Write-Host "Frontend started (Job ID: $($FRONTEND_JOB.Id))" -ForegroundColor Green

    # Wait for frontend to initialize
    Start-Sleep -Seconds 2

    # Start backend
    Write-Host "`n[2/2] Starting Backend..." -ForegroundColor Green
    Push-Location $BACKEND_DIR

    $PORT = if ($env:PORT) { $env:PORT } else { "8000" }

    # Check for venv
    $PYTHON_CMD = if (Test-Path "venv\Scripts\python.exe") {
        Write-Host "Using virtual environment Python" -ForegroundColor Green
        "venv\Scripts\python.exe"
    } else {
        Write-Host "Warning: venv not found, using system Python" -ForegroundColor Yellow
        "python"
    }

    # Start backend with uvicorn (no debugger, debug log level)
    $BACKEND_JOB = Start-Job -ScriptBlock {
        Set-Location $using:BACKEND_DIR
        & $using:PYTHON_CMD -m uvicorn app.main:app --port $using:PORT --host 0.0.0.0 --reload --log-level debug 2>&1 | Out-File "$using:SCRIPT_DIR\backend.log" -Encoding UTF8
    }
    Pop-Location
    Write-Host "Backend started (Job ID: $($BACKEND_JOB.Id))" -ForegroundColor Green
    Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3

    Write-Host "`n========================================" -ForegroundColor Blue
    Write-Host "Services Started!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host "Frontend:      http://localhost:3000" -ForegroundColor Green
    Write-Host "Backend API:   http://localhost:$PORT" -ForegroundColor Green
    Write-Host "API Docs:      http://localhost:$PORT/docs" -ForegroundColor Green
    Write-Host "`nLog Level:     DEBUG (verbose webhook logging)" -ForegroundColor Cyan
    Write-Host "`nLogs:"
    Write-Host "  Frontend:    $SCRIPT_DIR\frontend.log" -ForegroundColor Yellow
    Write-Host "  Backend:     $SCRIPT_DIR\backend.log" -ForegroundColor Yellow
    Write-Host "`nPress Ctrl+C to stop all services" -ForegroundColor Yellow
    Write-Host "========================================`n" -ForegroundColor Blue

    # Wait for jobs and handle Ctrl+C
    while ($FRONTEND_JOB.State -eq "Running" -or $BACKEND_JOB.State -eq "Running") {
        Start-Sleep -Seconds 1

        # Check for job failures
        if ($FRONTEND_JOB.State -eq "Failed") {
            Write-Host "Frontend job failed!" -ForegroundColor Red
            Receive-Job $FRONTEND_JOB
            break
        }
        if ($BACKEND_JOB.State -eq "Failed") {
            Write-Host "Backend job failed!" -ForegroundColor Red
            Receive-Job $BACKEND_JOB
            break
        }
    }
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
finally {
    Cleanup
}
