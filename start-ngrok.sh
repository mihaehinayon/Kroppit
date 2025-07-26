#!/bin/bash

echo "🌐 Starting ngrok tunnel for port 3000..."

# Start ngrok in background
ngrok http 3000 --host-header=localhost:3000 > /dev/null 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app')

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL. Make sure port 3000 is available."
    exit 1
fi

echo "✅ Ngrok tunnel started!"
echo "🌐 Public URL: $NGROK_URL"
echo "📊 Ngrok Dashboard: http://localhost:4040"
echo ""
echo "📝 Copy this command to set your environment variable:"
echo "export NGROK_URL=$NGROK_URL"
echo ""
echo "Then restart your dev server with: npm run dev"