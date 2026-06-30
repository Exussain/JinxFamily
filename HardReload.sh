#!/bin/bash
cd /root/NubixShop/public/frontend
npm run build && pm2 restart nubix-frontend
