#!/bin/bash
set -e

echo "[Deploy] Staging deployment started"

# 1. Verify git status
if [ ! -z "$(git status --porcelain)" ]; then
  echo "[Error] Uncommitted changes. Commit first."
  exit 1
fi

# 2. Build
echo "[Deploy] Building..."
npm run build

# 3. Database migrations
echo "[Deploy] Running migrations..."
npx prisma migrate deploy --skip-generate

# 4. Copy to staging server (example)
echo "[Deploy] Build ready. Manual deploy:"
echo "  rsync -av .next/ user@staging-server:/app/.next/"
echo "  ssh user@staging-server 'systemctl restart conectamente'"

echo "[Deploy] Complete! Visit: https://staging.conectamente.cl"
