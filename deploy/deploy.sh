#!/usr/bin/env bash
# Запускается на VPS пользователем deploy при пуше в main (через GitHub Actions)
# либо вручную: `ssh deploy@VPS 'cd /var/www/shadov && ./deploy/deploy.sh'`
set -euo pipefail

APP_DIR="/var/www/shadov"
PM2_NAME="shadov"

cd "$APP_DIR"

echo "==> [1/5] git fetch + reset to origin/main"
git fetch --prune origin main
git reset --hard origin/main

echo "==> [2/5] bun install (frozen)"
bun install --frozen-lockfile

echo "==> [3/5] build (Node preset)"
NITRO_PRESET=node-server bun run build

echo "==> [4/5] pm2 reload (zero-downtime)"
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 reload "$PM2_NAME" --update-env
else
  pm2 start deploy/ecosystem.config.cjs
  pm2 save
fi

echo "==> [5/5] OK — deploy finished at $(date -Iseconds)"