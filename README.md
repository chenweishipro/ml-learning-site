# ML 学习站 · 中文机器学习教程

一个完整的**中文机器学习学习平台**,从零基础到深度学习 / NLP / 时间序列 / MLOps,系统化课程 + 可运行代码 + 交互可视化 + 社区化。

> 🌐 线上: <http://122.51.221.63:7892> (IP 直连 · nginx 兜底 · systemd 守护)
> 📦 21 个版本 · 19 个公开特性 · 14 门课 48 个章节 · 全程中文

---

## ✨ 特性 (v9 ~ v13)

### 🧠 学习引擎 (v9.x)
- 🏆 **14 门系统化课程, 48 章节**: 机器学习入门 → 监督学习 → 神经网络 → 深度学习进阶 → 强化学习 + 6 门统计 + **3 门 v13.1 新课** (NLP / 时间序列 / MLOps)
- 🎮 **Monaco + Pyodide**: 浏览器内 Python 编程,免安装直接跑
- 🧩 **4 道编程挑战**: 在线提交代码,自动评测
- 🤖 **AI 出题**: LLM 兜底 + 内容 hash 缓存, 5 道题 10 秒
- 💬 **多轮 AI 答疑**: 10 条对话历史, anonymous 自动降级 mock
- 🗺️ **学习路线图**: SVG 课程依赖图, 看完一眼掌握全局
- 🏗️ **6 个 Capstone 实战项目**: Titanic / Boston / 推荐 / 情感分析 / A-B / CIFAR-10
- 📖 **术语表**: 18 个 ML/统计/数学/代码/数据术语, 鼠标 hover 即看
- 🎖️ **16 枚成就徽章**: 4 阶 (铜/银/金/铂), 学习过程自动颁发

### 👥 学习社区 (v10.x)
- 👤 **公开用户主页** + 关注 (`/u/[id]/`)
- 💬 **嵌套评论** (Discourse 风格折叠 + @ mention 通知 + 引用)
- ✏️ **个人资料编辑** (头像 / bio / 隐私)
- 🔔 **通知中心** (Bell + badge + 下拉, 嵌入全局 layout)
- 🤝 **学习圈** (基于共同完成课程的相似用户推荐 + 一键关注)

### 🔄 学习闭环 (v11.x)
- 📥 **章节下载** (Markdown / Text / HTML, 一键保存)
- 📊 **admin 章节质量报告** (8 维健康度分析, 帮 admin 找问题章节)
- 📱 **PWA** (install prompt + manifest shortcuts + 离线章节缓存)

### ✨ 打磨与增长 (v12.x)
- ✨ **错题 AI 讲解** (LLM 针对性讲解 + SHA256 缓存 + 24h TTL)
- 🎁 **邀请码系统** (生成 8 位码 → 注册双方得徽章: 新种子 / 破冰者 / 分享者 / 大使)
- ⚙️ **systemd 服务化** (Restart=always + 5s 内崩溃自动拉起 + journald 日志)

### 📧 触达与稳定 (v13.x)
- 📚 **3 门新课** (NLP 入门 / 时间序列分析 / MLOps 入门) — 11 个新章节
- 📧 **邮件简报周报** (紫粉渐变 HTML 模板, SMTP 配错时落本地 log, cron 每周一 9:00)
- 🏥 **健康检查** `/api/health` (DB + LLM + disk 实时状态)
- 📈 **Prometheus metrics** `/api/metrics` (8 个核心指标, Grafana / 监控告警直接用)
- 🚨 **监控告警脚本** `scripts/monitor.sh` + cron `*/5 * * * *` (systemd 状态 / health / DB 大小 / journal 错误)
- 🌐 **域名 + HTTPS 一键部署** (`scripts/setup-https.sh` + nginx + certbot)

### 🛠 基础体验 (v8.x)
- 🔍 **全文搜索 + 语义搜索 + AI 摘要** (FTS5 + embedding)
- 🌗 **暗色模式** (跟随系统 / 手动 / 本地存储)
- ✅ **学习进度追踪** (章节标记完成 + 热力图)
- 📐 **数学公式渲染** (KaTeX)
- 📊 **个人数据看板** (heatmap / 课程进度 / 推荐下一步)
- 🐍 **Python 演练场** (Monaco + Pyodide, 实时执行)

---

## 🛠 技术栈

- **Next.js 14** (App Router + standalone 输出)
- **TypeScript** + **Tailwind CSS**
- **MDX** (`next-mdx-remote` 5.0)
- **Prisma + SQLite** (单文件 dev.db, 简单部署)
- **MiniMax-Text-01** (LLM 答疑 / 出题 / 错题讲解 / AI 总结)
- **Pyodide** (浏览器 Python)
- **Monaco Editor** (代码高亮)
- **KaTeX** (数学公式)
- **systemd + journald** (进程管理)
- **Nginx + Let's Encrypt** (HTTPS)
- **cron** (定时任务)

---

## 📁 项目结构

```
ml-learning/
├── app/                    # Next.js App Router
│   ├── courses/[slug]/[chapter]/   # 章节详情 + MDX 渲染
│   ├── me/                 # 个人中心 (进度 / 错题 / 成就 / 资料编辑 / 邀请码 / 设置)
│   ├── admin/              # 管理后台 (analytics / quality / users / proposals)
│   ├── api/                # 后端 API (40+ 端点)
│   │   ├── chat/, ai/, auth/, quiz/, study/, recommend/, follow/, badges/
│   │   ├── invite/, newsletter/, health/, metrics/
│   ├── chat/, capstone/, glossary/, curriculum/, playground/python/
│   └── u/[id]/             # 公开用户主页
├── components/             # React 组件 (40+)
│   ├── notifications/, auth/, comments/, admin/, layout/, home/, interactive/
├── content/courses/        # 14 门课 48 章 MDX 内容
│   ├── ml-basics/, supervised-learning/, neural-networks/, deep-learning-advanced/
│   ├── reinforcement-learning/
│   ├── stats-foundations/, stats-probability/, stats-continuous/, stats-estimation/
│   ├── stats-testing/, stats-regression/
│   └── nlp-basics/, time-series/, mlops/   # v13.1 新课
├── lib/                    # 业务逻辑 (50+ 模块)
│   ├── auth.ts, db.ts, llm.ts, content.ts, quizzes.ts, badges.ts,
│   ├── newsletter.ts, quality-report.ts, people.ts, public-profile.ts,
│   ├── recommendations, chat-sessions, comments, notes, qa, proposals, ...
├── prisma/                 # 数据库 schema + migrations
├── public/                 # 静态资源 (manifest.json, sw.js, icons, images)
├── scripts/                # 部署 + 维护脚本
│   ├── install-systemd.sh, setup-https.sh, monitor.sh, newsletter-cron.sh
│   └── nginx/ml-learning.conf
└── .env                    # 环境变量 (DATABASE_URL, LLM_API_KEY, ...)
```

---

## 🚀 快速开始 (本地开发)

```bash
# 1. 装依赖
npm install

# 2. 准备数据库
npx prisma generate
npx prisma db push   # 首次跑, 创建 dev.db

# 3. 启动开发服务
npm run dev
# → http://localhost:3000
```

### 环境变量 (`.env.local`)
```bash
# LLM (MiniMax)
LLM_PROVIDER=minimax
MINIMAX_API_KEY=sk-cp-...
MINIMAX_BASE_URL=https://api.minimaxi.com/v1
MINIMAX_MODEL=MiniMax-Text-01

# 数据库
DATABASE_URL="file:./prisma/dev.db"

# Session
AUTH_SESSION_SECRET=please-change-me
```

---

## 🏗 生产部署 (systemd)

```bash
# 1. build
npm install
npx prisma generate
npx next build
# 产物: .next/standalone/

# 2. 准备部署目录
mkdir -p /opt/ml-learning
cp -r .next/standalone/* /opt/ml-learning/
cp -r .next/static /opt/ml-learning/.next/
cp -r public /opt/ml-learning/

# 3. 配 systemd (一键)
sudo bash scripts/install-systemd.sh
# → sudo systemctl status ml-learning
# → sudo journalctl -u ml-learning -n 50 --no-pager
```

服务配置 (`/etc/systemd/system/ml-learning.service`):
- `Type=simple`, `User=ubuntu`, `WorkingDirectory=/opt/ml-learning`
- `ExecStart=/usr/bin/node .next/standalone/server.js`
- `Restart=always`, `RestartSec=5` (崩溃 5s 内自动拉起)
- `Environment` 内联 (PORT/HOSTNAME/DATABASE_URL/LLM_API_KEY/...)
- `LimitNOFILE=65535` + Hardening (NoNewPrivileges / ProtectSystem / ProtectHome / PrivateTmp)

---

## 🌐 域名 + HTTPS (v13.4)

```bash
# 1. DNS A 记录
#    ml.example.com    A    122.51.221.63
#    www.ml.example.com A    122.51.221.63

# 2. 一键部署
cd /workspace/ml-site
sudo ./scripts/setup-https.sh ml.example.com admin@example.com

# 脚本自动:
# - 装 certbot + python3-certbot-nginx
# - 拷 nginx 配置 → /etc/nginx/sites-available/
# - certbot --nginx 申请证书 (Let's Encrypt)
# - HTTP → HTTPS 301 重定向
# - 加 certbot 自动续期 cron
# - reload nginx
```

nginx 关键配置:
- TLSv1.2/1.3, HSTS (max-age=63072000), 强密码套件
- `/_next/static` 1 年 immutable 缓存
- `/sw.js` no-cache (PWA 关键)
- `/api/` 限流 60r/s + burst=20
- 反代到 `127.0.0.1:7892` (systemd ml-learning.service)

详细见 [scripts/nginx/README.md](./scripts/nginx/README.md)

---

## 📊 监控 + 告警 (v13.3)

### `/api/health` — 健康检查
```bash
curl http://127.0.0.1:7892/api/health
# {
#   "status": "healthy",
#   "uptimeSec": 12345,
#   "checks": {
#     "db": { "ok": true, "latencyMs": 3 },
#     "llm": { "ok": true, "latencyMs": 0 },
#     "disk": { "ok": true, "sizeMb": 1 }
#   },
#   "timestamp": "2026-06-22T..."
# }
```

### `/api/metrics` — Prometheus 格式
```bash
curl http://127.0.0.1:7892/api/metrics
# ml_site_uptime_seconds 12345
# ml_site_users_total 11
# ml_site_chapter_progress_total 8
# ml_site_memory_rss_bytes ...
```

### `scripts/monitor.sh` — cron 自动监控
```bash
# 5 分钟跑一次, 检查 systemd / health / db 大小 / journal 错误
*/5 * * * * /opt/ml-learning/scripts/monitor.sh

# 可选 webhook 推 Slack/钉钉/飞书 (env MONITOR_WEBHOOK)
export MONITOR_WEBHOOK="https://hooks.slack.com/services/XXX"
```

---

## 📧 邮件简报 (v13.2)

```bash
# 订阅
curl -X POST http://127.0.0.1:7892/api/newsletter/subscribe \
  -d '{"enabled": true, "frequency": "weekly", "topics": ["new_chapters", "progress"]}'

# admin 预览
curl http://127.0.0.1:7892/api/newsletter/preview  # HTML

# admin 发送 (SMTP 未配置则落本地 log)
curl -X POST http://127.0.0.1:7892/api/newsletter/send \
  -d '{"limit": 100}'

# cron 每周一 9:00 自动发
0 9 * * 1 /opt/ml-learning/scripts/newsletter-cron.sh
```

**SMTP 配置** (`.env`):
```bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_xxx
SMTP_SECURE=true
```

未配置时, 邮件落到 `/opt/ml-learning/.next/standalone/ml-newsletter.log` 方便调试。

---

## 🤝 贡献

虽然代码可以 fork, 但请记住:
- 内容 (MDX) 引用了 **《基础统计学》第 14 版** (Mario F. Triola, 电子工业出版社), 仅用于教学
- 代码采用 MIT 协议

---

## 📜 版本历史

| 版本 | 主题 | 特性数 |
|------|------|--------|
| v8.x | 基础体验 (搜索/PWA/RAG/统计) | 12 |
| v9.1-v9.7 | 学习引擎 (Monaco/编程题/AI答疑/路线图/Capstone/Glossary/Badge) | 8 |
| v9.7.1 | 补齐 /login 路由 | 1 |
| v10.1-v10.7 | 学习社区 (公开主页/评论/AI出题/资料编辑/通知/学习圈/chat-anon) | 7 |
| v11.1-v11.3 | 学习闭环 (下载/质量报告/PWA) | 3 |
| v12.1-v12.3 | 打磨稳定 (错题AI/邀请码/systemd) | 3 |
| **v13.1** | **3 门新课 11 章 (NLP/时间序列/MLOps)** | **1** |
| **v13.2** | **邮件简报周报** | **1** |
| **v13.3** | **监控告警 (health + metrics + monitor.sh)** | **1** |
| **v13.4** | **域名 + HTTPS 一键部署** | **1** |

共 **38 个版本** / **24 个 tag** / **38 个特性** / **48 章节** / **14 门课**

---

## 📜 致谢

- **统计内容**: 来自 *《基础统计学》第 14 版* (Mario F. Triola, 钱辰江/潘文皓 译, 电子工业出版社)
- **LLM 接入**: [MiniMax-Text-01](https://api.minimaxi.com)
- **前端框架**: [Next.js 14](https://nextjs.org) + [Tailwind CSS](https://tailwindcss.com)
- **部署**: Ubuntu 24.04 + systemd + nginx + Let's Encrypt
- **作者**: [chenweishi](https://github.com/chenweishipro)

---

🌟 如果这个项目对你有帮助, 给个 star 吧!
