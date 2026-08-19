#!/bin/bash
set -e

BASE_URL="${1:-https://staging.conectamente.cl}"

echo "[Test] Running smoke tests against $BASE_URL"

# Test 1: Health check
echo "[Test] 1. Login page..."
curl -f -s "$BASE_URL/login" > /dev/null && echo "✓ Login page loads" || echo "✗ Login page failed"

# Test 2: API responds
echo "[Test] 2. API health..."
curl -f -s "$BASE_URL/api/auth/session" > /dev/null && echo "✓ API responds" || echo "✗ API failed"

echo "[Test] Smoke tests complete!"
