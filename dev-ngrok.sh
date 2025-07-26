#!/bin/bash

# Kill any existing ngrok processes
pkill -f ngrok

echo "🚀 Starting Kroppit with ngrok for Farcaster Mini App testing..."

# Start Next.js dev server in background
echo "📦 Starting Next.js dev server on port 3000..."
npm run dev &
NEXTJS_PID=$!

# Wait for Next.js to start
echo "⏳ Waiting for Next.js to start..."
sleep 5

# Start ngrok tunnel
echo "🌐 Starting ngrok tunnel..."
ngrok http 3000 --host-header=localhost:3000 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3

# Get ngrok URL
echo "🔍 Getting ngrok URL..."
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app')

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL. Make sure ngrok is running."
    kill $NEXTJS_PID $NGROK_PID 2>/dev/null
    exit 1
fi

echo ""
echo "✅ Kroppit is now running with ngrok!"
echo "🌐 Public URL: $NGROK_URL"
echo "💻 Local URL: http://localhost:3000"
echo "📊 Ngrok Dashboard: http://localhost:4040"
echo ""
echo "📝 To test with this URL, set NGROK_URL environment variable:"
echo "   export NGROK_URL=$NGROK_URL"
echo "   npm run dev"
echo ""
echo "🔧 Or restart this script with the environment variable:"
echo "   NGROK_URL=$NGROK_URL ./dev-ngrok.sh"
echo ""
echo "🧪 Test your Mini App embed at: https://warpcast.com/~/compose"
echo ""

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $NEXTJS_PID $NGROK_PID 2>/dev/null
    pkill -f ngrok
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Keep script running
echo "Press Ctrl+C to stop all servers..."
wait