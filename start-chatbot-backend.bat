@echo off
REM Start Flask Backend for Gemini Chatbot

echo ========================================
echo Starting Gemini Chatbot Flask Backend
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher from https://www.python.org/
    pause
    exit /b 1
)

echo Python detected. Checking dependencies...

REM Check if Flask is installed
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo Flask not found. Installing dependencies...
    python -m pip install -r server\requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
) else (
    echo Dependencies already installed.
)

echo.
echo Starting Flask server on port 5001...
echo Backend URL: http://localhost:5001
echo Health Check: http://localhost:5001/api/health
echo.

cd server
python chatbot_api.py

pause
