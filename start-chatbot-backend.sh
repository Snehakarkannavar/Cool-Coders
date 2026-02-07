#!/bin/bash
# Start Flask Backend for Gemini Chatbot

echo "========================================"
echo "Starting Gemini Chatbot Flask Backend"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

echo "Python detected. Checking dependencies..."

# Check if Flask is installed
if ! python3 -c "import flask" &> /dev/null; then
    echo "Flask not found. Installing dependencies..."
    python3 -m pip install -r server/requirements.txt
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
    echo "Dependencies installed successfully!"
else
    echo "Dependencies already installed."
fi

echo ""
echo "Starting Flask server on port 5001..."
echo "Backend URL: http://localhost:5001"
echo "Health Check: http://localhost:5001/api/health"
echo ""

cd server
python3 chatbot_api.py
