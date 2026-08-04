#!/bin/bash
set -euo pipefail

LOCKFILE="/tmp/jinxfamily_hardreload.lock"
exec 200>"$LOCKFILE"
if ! flock -n 200; then
  echo "[HardReload] Another build/reload is already in progress. Exiting."
  exit 0
fi

export NODE_OPTIONS="--max-old-space-size=2048"

echo "Starting zero-downtime frontend rebuild..."

# Build from the real source path so React client-manifest module identifiers
# stay valid after the dist directory is swapped into production.
cd /root/jinxfamily/frontend
rm -rf .next-staging
echo "Compiling Next.js application into .next-staging..."
NEXT_DIST_DIR=.next-staging npm run build

# Stop the PM2-managed server before changing .next. Killing its port with
# fuser makes PM2 immediately resurrect it, allowing Next to index the old
# static directory while the swap is still in progress. That produces HTML
# which references chunks the running server returns as 404.
echo "Stopping frontend server before swapping build directories..."
pm2 stop jinxfamily-frontend

# Swap only after a successful build. Keep the previous build for rollback.
echo "Swapping build directories..."
rm -rf .next-prev
if [ -d .next ]; then
  mv .next .next-prev
fi
mv .next-staging .next

# Start only after .next is fully in place so Next indexes this build's
# complete static tree at process startup.
echo "Restarting frontend server..."
pm2 restart jinxfamily-frontend

echo "Build and reload completed successfully; rollback build retained at .next-prev."
