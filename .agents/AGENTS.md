# Project Rules

- **Post-Change Build & Restart**: Always run the `HardReload.sh` script (`/root/NubixShop/public/HardReload.sh`) after making any code changes in the frontend folder. This compiles the Next.js application and restarts the pm2 server to apply the changes.

- **Pre-Deployment Process Check & Termination (MANDATORY FOR ALL AGENTS)**: Before starting any deployment or executing `HardReload.sh`, you MUST check for any currently running `HardReload.sh` or `next build` scripts. If an existing or stale deployment process is running, you MUST terminate it completely first, verify that it has stopped, and only then start exactly one fresh `/root/NubixShop/public/HardReload.sh`. This prevents concurrent builds from running and corrupting `.next-build`, `.next-prev`, and `.next` directories.

  **Mandatory Steps to follow before every deployment:**
  1. Check for running deployment scripts: `pgrep -a -f 'HardReload.sh|next build'`
  2. If any process is running, terminate it immediately:
     `pkill -TERM -f 'HardReload.sh'; pkill -TERM -f 'next build'; sleep 2; pkill -9 -f 'HardReload.sh'; pkill -9 -f 'next build'`
  3. Verify that all processes have stopped: `sleep 2 && pgrep -f 'HardReload.sh|next build' || echo 'All clear'`
  4. Only after confirming no running script remains, run the fresh `/root/NubixShop/public/HardReload.sh`.
