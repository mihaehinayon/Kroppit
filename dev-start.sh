#!/bin/bash
# dev-start.sh - Use this instead of direct npm run dev
echo "Cleaning development environment..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
rm -rf .next
lsof -ti:3000,3001,3002 | xargs kill -9 2>/dev/null || true
echo "Verifying Next.js installation..."
if [ ! -f "node_modules/.bin/next" ]; then
    echo "Next.js binary missing, reinstalling..."
    npm install next@latest
fi
echo "Starting development server..."
npx next dev