#!/bin/bash

# Get the current ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url // empty')

if [ -z "$NGROK_URL" ]; then
    echo "❌ No ngrok tunnel found. Make sure ngrok is running first."
    exit 1
fi

echo "🌐 Using ngrok URL: $NGROK_URL"
echo "🚀 Starting Next.js with ngrok integration..."

# Export the ngrok URL and start dev server
export NGROK_URL=$NGROK_URL
npm run dev