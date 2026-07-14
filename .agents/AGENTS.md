# Project Rules

- **Post-Change Build & Restart**: Always run the `HardReload.sh` script (`/root/NubixShop/public/HardReload.sh`) after making any code changes in the frontend folder. This compiles the Next.js application and restarts the pm2 server to apply the changes.

- **Pre-Deployment Process Check (MANDATORY)**: Before starting any deployment, you MUST check for any existing `HardReload.sh` or its `next build --webpack` child processes. If an older/stale deployment is still running, terminate it completely first, verify that it has stopped, and then start exactly one fresh `/root/NubixShop/public/HardReload.sh`. This prevents multiple builds from running concurrently and racing/corrupting the `.next-build`, `.next-prev`, and `.next` build directories.

  **Steps to follow before every `HardReload.sh` run:**
  1. Check for running processes: `pgrep -a -f 'HardReload.sh|next build'`
  2. If any are found, kill them: `pkill -TERM -f 'HardReload.sh'; pkill -TERM -f 'next build --webpack'`
  3. Wait and verify they are gone: `sleep 3 && pgrep -f 'HardReload.sh|next build' || echo 'All clear'`
  4. Only after confirming no stale processes exist, start the fresh deployment.
