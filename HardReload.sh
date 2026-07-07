#!/bin/bash
set -euo pipefail
cd /root/NubixShop/public/frontend
rm -rf .next-build
NEXT_DIST_DIR=.next-build npm run build
rm -rf .next-prev
if [ -d .next ]; then
  mv .next .next-prev
fi
mv .next-build .next
pm2 restart nubix-frontend
