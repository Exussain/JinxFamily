# Project Rules

> **Note**: Superseded by `CLAUDE.md` in the repo root. Kept for reference only.

- **Development Mode Requirement**: When working in `/root/NubixShop/public`, run the frontend server in **dev mode** (`npm run dev` inside `/root/NubixShop/public/frontend`) during active development instead of running `HardReload.sh` on every code edit.

- **Production Deployment (`HardReload.sh`)**: `HardReload.sh` (`/root/NubixShop/public/HardReload.sh`) compiles the Next.js production build and restarts the PM2 process. Use it only for final production releases or when explicitly requested.

- **Pre-Deployment Process Check & Termination (MANDATORY FOR ALL AGENTS)**: Before starting any deployment or executing `HardReload.sh`, you MUST check for any currently running `HardReload.sh` or `next build` scripts. If an existing or stale deployment process is running, you MUST terminate it completely first, verify that it has stopped, and only then start exactly one fresh `/root/NubixShop/public/HardReload.sh`.

  **Mandatory Steps to follow before every deployment:**
  1. Check for running deployment scripts: `pgrep -a -f 'HardReload.sh|next build'`
  2. If any process is running, terminate it immediately:
     `pkill -TERM -f 'HardReload.sh'; pkill -TERM -f 'next build'; sleep 2; pkill -9 -f 'HardReload.sh'; pkill -9 -f 'next build'`
  3. Verify that all processes have stopped: `sleep 2 && pgrep -f 'HardReload.sh|next build' || echo 'All clear'`

- **Current deployment path**: This checkout is served from `/root/NubixShop/public/frontend` (backend from `/root/NubixShop/public/backend`).

- **Homepage rail icons**: `frontend` now depends on `react-icons`; use its icon components for product-rail navigation controls instead of text glyphs.

- **Lazy Skill Activation (Progressive Disclosure)**: All workspace and global skills (`.agents/skills/*` and `~/.gemini/antigravity-cli/skills/*`) are registered lazily by name and description. Read a skill's `SKILL.md` using `view_file` only when a user prompt explicitly requires that domain expertise. Never preload unneeded skill files to keep the conversation context window fast, lean, and unbloated.
