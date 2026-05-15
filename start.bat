@echo off
REM ThinkDelta — Windows Startup Script
REM This starts the Flask backend (Windows users need Python installed)

echo ========================================
echo   ThinkDelta Full Stack Launcher (Win)
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install Python from python.org first.
    exit /b 1
)

REM Check dependencies
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo Installing Flask dependencies...
    pip install flask flask-cors requests
)

REM Set API key
set MINIMAX_API_KEY=sk-cp-GZ-C5lpRKytdJBM2H-tqS_WZ52dW-_2zMNELAJ0gFROWb3kgqPaSze9kA-r7ntHdxhktloINmWzWDqQNT-ls49BGoqy5cBbHo7QT4fgbwU6FI5cKplrkeu0

echo Starting Flask backend on port 8765...
cd backend
start python server.py

echo.
echo Backend running at http://localhost:8765
echo.
echo For a public tunnel, install cloudflared and run:
echo   cloudflared tunnel --url http://localhost:8765
echo.
pause
