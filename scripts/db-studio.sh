#!/usr/bin/env bash
# Run Drizzle Studio against the local D1 SQLite file (same DB the app uses when you run npm run dev).
# Requires: npm run build and npm run db:migrate at least once.
set -e
cd "$(dirname "$0")/.."
SQLITE=$(
  python - <<'PY'
import os, glob
paths = glob.glob(".wrangler/**/*.sqlite", recursive=True)
paths = [p for p in paths if os.path.isfile(p)]
if not paths:
  raise SystemExit(0)
paths.sort(key=lambda p: os.path.getmtime(p), reverse=True)
print(paths[0])
PY
)
if [ -z "$SQLITE" ]; then
  echo "No local D1 SQLite file found. Run: npm run build && npm run db:migrate"
  exit 1
fi
SQLITE_ABS=$(cd "$(dirname "$SQLITE")" && pwd)/$(basename "$SQLITE")
export DRIZZLE_DB_URL="file:${SQLITE_ABS}"
echo "Using DB: $SQLITE_ABS"
npx drizzle-kit studio
