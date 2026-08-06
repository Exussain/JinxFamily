# Deployment Safety Guide

## Overview

Before starting any deployment, we must **always** check for any existing `HardReload.sh` or
`next build` child processes. If an older/stale deployment is still running, we terminate
it completely first, verify that it has stopped, and then start **exactly one fresh**
`/root/jinxfamily/HardReload.sh`.

This prevents multiple builds from running concurrently and **racing/corrupting** the
`.next-build`, `.next-prev`, and `.next` build directories.

---

## Why This Matters

| Risk | Consequence |
|------|-------------|
| Two concurrent `next build` processes | Corrupted `.next-build` output (partial writes) |
| Old process still holding `.next-prev` lock | New deployment cannot safely rotate directories |
| Race between directory rename steps | Serving broken or mixed build artifacts |

---

## Mandatory Pre-Deployment Checklist

Follow these steps **every time** before invoking `HardReload.sh`:

### Step 1 — Discover stale processes

```bash
pgrep -a -f 'HardReload.sh|next build'
```

If this returns nothing → proceed to **Step 4**.  
If it returns PIDs → continue to **Step 2**.

### Step 2 — Terminate stale processes

```bash
pkill -TERM -f 'HardReload.sh'
pkill -TERM -f 'next build'
```

Wait a moment for graceful shutdown:

```bash
sleep 5
```

If processes are still alive after 5 seconds, escalate to `SIGKILL`:

```bash
pkill -KILL -f 'HardReload.sh'
pkill -KILL -f 'next build'
```

### Step 3 — Verify all stale processes are gone

```bash
pgrep -f 'HardReload.sh|next build' || echo 'All clear — safe to deploy'
```

> Do **not** proceed until this command outputs `All clear`.

### Step 4 — Start exactly one fresh deployment

```bash
/root/jinxfamily/HardReload.sh
```

---

## Quick One-Liner (Copy-Paste Safe)

```bash
pkill -TERM -f 'HardReload.sh'; pkill -TERM -f 'next build'; sleep 5; \
pgrep -f 'HardReload.sh|next build' && echo 'WARNING: processes still alive!' \
|| (echo 'All clear — starting fresh deployment' && /root/jinxfamily/HardReload.sh)
```

---

## Build Directory Reference

| Directory | Purpose |
|-----------|---------|
| `.next-build` | Active working directory during `next build` |
| `.next-prev`  | Previous build kept for atomic swap rollback |
| `.next`       | Live build served by pm2 / the web server |

These three directories are rotated atomically by `HardReload.sh`. Concurrent builds can partially
overwrite each other at any rotation step, producing broken deployments.

---

## Related Files

- [AGENTS.md](./AGENTS.md) — Top-level project rules (includes a summary of this policy)
- [HardReload.sh](../HardReload.sh) — The deployment script itself
