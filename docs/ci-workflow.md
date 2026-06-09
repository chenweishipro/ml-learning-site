# CI/CD 配置指南

## GitHub Actions (CI)

1. 在 GitHub 仓库 Settings → Developer settings → Personal access tokens → 创建一个 PAT
2. 勾选 **workflow** scope (必需, 否则无法 push .github/workflows/ 文件)
3. 把这个 token 作为远程 URL:
   ```
   git remote set-url origin https://<PAT>@github.com/chenweishipro/ml-learning-site.git
   ```
4. 推送 workflow 文件:
   ```bash
   git add .github/workflows/ci.yml
   git commit -m "ci: add GitHub Actions workflow"
   git push origin main
   ```

## 完整 CI 流水线 (.github/workflows/ci.yml)

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma db push --force-reset --accept-data-loss
        env:
          DATABASE_URL: "file:./test.db"
      - run: npm run typecheck
      - run: npm run build
        env:
          DATABASE_URL: "file:./test.db"
      - run: npx playwright install --with-deps chromium
      - run: |
          cp -r public .next/standalone/ 2>/dev/null || true
          cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
          (cd .next/standalone && DATABASE_URL="file:./workspace/ml-site/prisma/test.db" PORT=7893 node server.js &)
          sleep 8
          E2E_BASE_URL=http://127.0.0.1:7893 npm run test:e2e
```

## 每日 prisma.db 自动备份 (Cron)

服务器上添加 cron 任务:

\`\`\`bash
# 每天凌晨 3 点备份
0 3 * * * cd /opt/ml-learning && DATABASE_URL=file:./prisma/dev.db npx tsx scripts/backup-cli.mjs >> /var/log/ml-backup.log 2>&1
\`\`\`

或者用 systemd timer (更现代):

\`\`\`
# /etc/systemd/system/ml-backup.timer
[Unit]
Description=Daily ML learning site backup
Requires=ml-backup.service

[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
\`\`\`

\`\`\`
# /etc/systemd/system/ml-backup.service
[Unit]
Description=Backup prisma.db
After=network-online.target

[Service]
Type=oneshot
User=ml
WorkingDirectory=/opt/ml-learning
Environment=DATABASE_URL=file:./prisma/dev.db
ExecStart=/usr/bin/npx tsx scripts/backup-cli.mjs
StandardOutput=journal
StandardError=journal
\`\`\`

\`\`\`bash
systemctl daemon-reload
systemctl enable --now ml-backup.timer
systemctl list-timers ml-backup.timer
\`\`\`

## 备份到 S3 / 阿里云 OSS

设置环境变量:
\`\`\`bash
S3_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com  # 或 MinIO
S3_BUCKET=ml-learning-backups
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
S3_PRESIGNED_PUT_URL=https://...?X-Amz-Signature=...  # 推荐: 阿里云 OSS / MinIO 给的预签名 URL
\`\`\`
