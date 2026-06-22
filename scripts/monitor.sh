#!/bin/bash
# ML 学习站监控 + 告警
# 加到 crontab: */5 * * * * /opt/ml-learning/scripts/monitor.sh
set -u

HEALTH_URL="http://127.0.0.1:7892/api/health/"
SERVICE_NAME="ml-learning"
LOG="/tmp/ml-monitor.log"
WEBHOOK="${MONITOR_WEBHOOK:-}"
MAX_DB_SIZE_MB="${MAX_DB_SIZE_MB:-500}"

now() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(now)] $*" | tee -a "$LOG"; }

# 1) systemd 状态
SVC_STATUS=$(systemctl is-active "$SERVICE_NAME" 2>/dev/null || echo "unknown")
if [ "$SVC_STATUS" != "active" ]; then
  log "ALERT: $SERVICE_NAME is $SVC_STATUS"
  if [ -n "$WEBHOOK" ]; then
    curl -s -X POST -H 'Content-Type: application/json' \
      -d "{\"text\":\"🚨 [$SERVICE_NAME] service is $SVC_STATUS on $(hostname)\"}" \
      "$WEBHOOK" >/dev/null 2>&1
  fi
  exit 1
fi

# 2) /api/health
HEALTH=$(curl -sS -o /tmp/health.json -w '%{http_code}' --max-time 10 "$HEALTH_URL" 2>/dev/null)
if [ "$HEALTH" != "200" ]; then
  log "ALERT: /api/health returned $HEALTH"
  cat /tmp/health.json 2>/dev/null >> "$LOG"
  if [ -n "$WEBHOOK" ]; then
    curl -s -X POST -H 'Content-Type: application/json' \
      -d "{\"text\":\"🚨 [$SERVICE_NAME] /api/health=$HEALTH on $(hostname)\"}" \
      "$WEBHOOK" >/dev/null 2>&1
  fi
  exit 1
fi

# 3) DB 大小
DB="/opt/ml-learning/.next/standalone/prisma/dev.db"
if [ -f "$DB" ]; then
  SIZE_MB=$(du -m "$DB" | cut -f1)
  if [ "$SIZE_MB" -gt "$MAX_DB_SIZE_MB" ]; then
    log "WARN: dev.db is ${SIZE_MB}MB > ${MAX_DB_SIZE_MB}MB"
  fi
fi

# 4) journal 错误
RECENT_ERRORS=$(journalctl -u "$SERVICE_NAME" --since "5 minutes ago" --no-pager -q 2>/dev/null | grep -ciE "error|panic|unhandled" || echo 0)
if [ "$RECENT_ERRORS" -gt "10" ]; then
  log "WARN: $RECENT_ERRORS errors in last 5min journal"
  if [ -n "$WEBHOOK" ]; then
    curl -s -X POST -H 'Content-Type: application/json' \
      -d "{\"text\":\"⚠️ [$SERVICE_NAME] $RECENT_ERRORS errors in last 5min on $(hostname)\"}" \
      "$WEBHOOK" >/dev/null 2>&1
  fi
fi

# 5) 成功
log "OK: $SERVICE_NAME active, health=200, db=${SIZE_MB:-?}MB, recent_errors=$RECENT_ERRORS"
exit 0
