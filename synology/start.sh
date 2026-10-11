#!/bin/bash
# EAN Scanner startup script for Synology NAS (same setup as the recept app).

APP_DIR="/volume1/homes/Martin/ean"
LOG_DIR="$APP_DIR/logs"
PID_FILE="$APP_DIR/app.pid"

# Find Node.js (Package Center install). /usr/local/bin is checked explicitly because
# Task Scheduler runs with a minimal PATH.
if [ -x "/usr/local/bin/node" ]; then
  NODE_PATH="/usr/local/bin"
elif command -v node > /dev/null 2>&1; then
  NODE_PATH=$(dirname "$(command -v node)")
else
  NODE_PATH=$(find -L /var/packages -maxdepth 6 -name "node" -type f 2>/dev/null | head -1 | xargs -r dirname)
fi
if [ -z "$NODE_PATH" ] || [ ! -f "$NODE_PATH/node" ]; then
  echo "$(date): ERROR - Cannot find Node.js installation"
  exit 1
fi

mkdir -p "$LOG_DIR"
cd "$APP_DIR" || exit 1

# Check if already running
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if ps -p "$OLD_PID" > /dev/null 2>&1; then
    echo "$(date): EAN Scanner is already running with PID $OLD_PID"
    exit 1
  fi
  echo "$(date): Removing stale PID file"
  rm -f "$PID_FILE"
fi

# .env is read by the app itself (dotenv), so no need to export it here.
echo "$(date): Starting EAN Scanner with Node.js $("$NODE_PATH/node" --version)..."
"$NODE_PATH/node" "$APP_DIR/index.js" >> "$LOG_DIR/app.log" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"

sleep 3
if ps -p "$NEW_PID" > /dev/null 2>&1; then
  echo "$(date): EAN Scanner started with PID $NEW_PID (logs: $LOG_DIR/app.log)"
else
  echo "$(date): ERROR - EAN Scanner failed to start. Last log lines:"
  tail -20 "$LOG_DIR/app.log" 2>/dev/null
  rm -f "$PID_FILE"
  exit 1
fi
