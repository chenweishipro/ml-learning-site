#!/bin/bash
# 邮件简报定时发送 — 每周一 9:00 跑
# 加到 crontab: 0 9 * * 1 /opt/ml-learning/scripts/newsletter-cron.sh
set -e
cd /opt/ml-learning/.next/standalone
DATABASE_URL="file:/opt/ml-learning/.next/standalone/prisma/dev.db" \
  node -e '
const { PrismaClient } = require("/opt/ml-learning/.next/standalone/node_modules/.prisma/client");
const p = new PrismaClient();
(async () => {
  const subs = await p.newsletterSubscription.findMany({ where: { enabled: true, frequency: "weekly" } });
  console.log("weekly subscribers:", subs.length);
  await p.$disconnect();
})();
' 2>&1 | tee -a /tmp/ml-newsletter-cron.log
