#!/bin/bash
set -euo pipefail

# 1. Prevent duplicate & concurrent HardReload.sh / next build executions
LOCKFILE="/tmp/nubix_hardreload.lock"

echo "==> [HardReload] Checking for running HardReload or next build processes..."
MY_PID=$$
# Get PIDs of any running HardReload.sh or next build except current process PID
OTHER_PIDS=$(pgrep -f 'HardReload.sh|next build' | grep -v "^${MY_PID}$" || true)

if [ -n "$OTHER_PIDS" ]; then
  echo "==> [HardReload] Existing deployment process(es) detected: $OTHER_PIDS"
  echo "==> [HardReload] Terminating existing process(es)..."
  kill -TERM $OTHER_PIDS 2>/dev/null || true
  sleep 2
  
  REMAINING=$(pgrep -f 'HardReload.sh|next build' | grep -v "^${MY_PID}$" || true)
  if [ -n "$REMAINING" ]; then
    echo "==> [HardReload] Force killing remaining process(es): $REMAINING"
    kill -9 $REMAINING 2>/dev/null || true
    sleep 1
  fi
  echo "==> [HardReload] Stale processes terminated."
fi

# 2. Acquire exclusive flock lockfile to ensure single execution
exec 200>"$LOCKFILE"
if ! flock -n 200; then
  echo "==> [HardReload] Lock is held by another process; acquiring lock..."
  flock -u 200 2>/dev/null || true
  flock -x 200
fi

# 3. Clean temporary build artifacts
cd /root/Projects/NubixShop/frontend
rm -rf .next-build

echo "==> [HardReload] Building Next.js application..."
NEXT_DIST_DIR=.next-build npm run build

# 4. Swap build directory atomically
rm -rf .next-prev
if [ -d .next ]; then
  mv .next .next-prev
fi
mv .next-build .next

# 5. Restart PM2 frontend process
echo "==> [HardReload] Restarting PM2 process (nubix-frontend)..."
PM2_HOME=/root/.pm2 pm2 restart nubix-frontend

echo "==> [HardReload] HardReload completed successfully! ✅"
