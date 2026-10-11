#!/bin/bash
# EAN Scanner status script for Synology NAS.

APP_DIR="/volume1/homes/Martin/ean"
PID_FILE="$APP_DIR/app.pid"
LOG_FILE="$APP_DIR/logs/app.log"

echo "=== EAN Scanner Status ==="
if [ -f "$PID_FILE" ] && ps -p "$(cat "$PID_FILE")" > /dev/null 2>&1; then
  echo "Status: RUNNING (PID $(cat "$PID_FILE"))"
else
  echo "Status: NOT RUNNING"
fi

echo ""
echo "=== Recent Logs ==="
tail -20 "$LOG_FILE" 2>/dev/null || echo "No log file at $LOG_FILE"
