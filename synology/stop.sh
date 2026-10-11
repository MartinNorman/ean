#!/bin/bash
# EAN Scanner stop script for Synology NAS.
# Only stops this app's process; never touches other Node apps (e.g. recept).

APP_DIR="/volume1/homes/Martin/ean"
PID_FILE="$APP_DIR/app.pid"

PID=""
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
else
  PID=$(ps aux | grep "[n]ode $APP_DIR/index.js" | awk '{print $2}' | head -1)
fi

if [ -n "$PID" ] && ps -p "$PID" > /dev/null 2>&1; then
  echo "$(date): Stopping EAN Scanner (PID: $PID)..."
  kill "$PID" 2>/dev/null || sudo kill "$PID" 2>/dev/null
  sleep 2
  if ps -p "$PID" > /dev/null 2>&1; then
    echo "$(date): Force killing EAN Scanner..."
    kill -9 "$PID" 2>/dev/null || sudo kill -9 "$PID" 2>/dev/null
  fi
  echo "$(date): EAN Scanner stopped"
else
  echo "$(date): EAN Scanner is not running"
fi
rm -f "$PID_FILE"
