---
name: jinxfamily-deploy-hardreload
description: >-
  Mandatory safe deployment workflow for JinxFamily. Use this skill whenever
  making code changes to frontend or backend files in JinxFamily, before running
  HardReload.sh or restarting PM2 processes.
---

# Safe Deployment Workflow (`HardReload.sh`)

This skill defines the mandatory protocol for building and deploying updates to the live JinxFamily application.

> [!IMPORTANT]
> When working in `/Projects/JinxFamily`, run the frontend server in dev mode (`npm run dev` in `frontend/`) during active development instead of executing `HardReload.sh` on every change. Use `HardReload.sh` for production deployments or when explicitly requested.

## Pre-Deployment Process Check (MANDATORY)

Before executing `/root/JinxFamily/public/HardReload.sh` or `next build`, you MUST check for and terminate any stale or concurrent build processes to prevent `.next-build`, `.next-prev`, and `.next` directory corruption.

### 1. Check for Running Deployment Scripts
```bash
pgrep -a -f 'HardReload.sh|next build'
```

### 2. Terminate Stale Processes (If Any Found)
```bash
pkill -TERM -f 'HardReload.sh'; pkill -TERM -f 'next build'; sleep 2; pkill -9 -f 'HardReload.sh'; pkill -9 -f 'next build'
```

### 3. Verify All Processes Stopped
```bash
sleep 2 && pgrep -f 'HardReload.sh|next build' || echo 'All clear'
```

## Execution

Only after confirming no running script remains, run the fresh reload script:
```bash
/root/JinxFamily/public/HardReload.sh
```

## Backend Process Restart

If changes were made to Django backend files (`backend/`):
```bash
pm2 restart jinxfamily-backend
```

## Deployment Verification Checklist

1. Check PM2 service status:
   ```bash
   pm2 status
   ```
2. Inspect PM2 logs for errors:
   ```bash
   pm2 logs jinxfamily-frontend --lines 30 --no-daemon
   pm2 logs jinxfamily-backend --lines 30 --no-daemon
   ```
3. Update Persian Changelog in `frontend/CHANGELOG.md` with entry date and change description.
