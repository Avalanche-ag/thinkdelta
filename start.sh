#!/bin/bash
# ThinkDelta — Full Stack Startup Script
# This script starts the Flask backend and the cloudflared tunnel.
# Run this whenever you want the live backend to be available.

set -e

echo "=================================="
echo "  ThinkDelta Full Stack Launcher"
echo "=================================="
echo ""

# Add local bin to PATH
export PATH="$HOME/.local/bin:$PATH"

# Kill any existing processes
kill $(cat /tmp/flask_pid.txt 2>/dev/null) 2>/dev/null || true
kill $(cat /tmp/cloudflared_pid.txt 2>/dev/null) 2>/dev/null || true
sleep 2

# Check dependencies
if ! command -v cloudflared &> /dev/null; then
    echo "ERROR: cloudflared not found in PATH"
    echo "Run: cp /tmp/cloudflared ~/.local/bin/cloudflared && chmod +x ~/.local/bin/cloudflared"
    exit 1
fi

if ! python3 -c "import flask" 2>/dev/null; then
    echo "ERROR: Flask not installed"
    echo "Run: pip3 install flask flask-cors requests --user"
    exit 1
fi

# Set MiniMax API Key
# IMPORTANT: Replace this with your actual key, or set it in your shell before running this script
export MINIMAX_API_KEY="${MINIMAX_API_KEY:-sk-cp-GZ-C5lpRKytdJBM2H-tqS_WZ52dW-_2zMNELAJ0gFROWb3kgqPaSze9kA-r7ntHdxhktloINmWzWDqQNT-ls49BGoqy5cBbHo7QT4fgbwU6FI5cKplrkeu0}"

if [ -z "$MINIMAX_API_KEY" ]; then
    echo "ERROR: MINIMAX_API_KEY not set"
    echo "Set it with: export MINIMAX_API_KEY='your-key-here'"
    exit 1
fi

echo "Starting Flask backend on port 8765..."
cd "$(dirname "$0")/backend"
nohup python3 server.py > /tmp/flask_server.log 2>&1 &
echo $! > /tmp/flask_pid.txt
sleep 4

echo "Starting cloudflared tunnel..."
nohup cloudflared tunnel --url http://localhost:8765 > /tmp/cloudflared.log 2>&1 &
echo $! > /tmp/cloudflared_pid.txt
sleep 8

# Extract tunnel URL
TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/cloudflared.log | head -1)

if [ -n "$TUNNEL_URL" ]; then
    echo ""
    echo "=================================="
    echo "  BACKEND IS LIVE!"
    echo "=================================="
    echo ""
    echo "Tunnel URL: $TUNNEL_URL"
    echo ""
    echo "IMPORTANT: Update app.js BACKEND_URL with this URL, then push to GitHub."
    echo ""
    echo "Frontend: https://avalanche-ag.github.io/thinkdelta/"
    echo "Backend:  $TUNNEL_URL"
    echo ""
    echo "Keep this terminal running. Press Ctrl+C to stop."
    echo ""
else
    echo "ERROR: Could not get tunnel URL. Check /tmp/cloudflared.log"
    cat /tmp/cloudflared.log
    exit 1
fi

# Keep script running until interrupted
trap "echo ''; echo 'Shutting down...'; kill \$(cat /tmp/flask_pid.txt 2>/dev/null) 2>/dev/null || true; kill \$(cat /tmp/cloudflared_pid.txt 2>/dev/null) 2>/dev/null || true; echo 'Done.'; exit 0" INT
while true; do sleep 1; done
