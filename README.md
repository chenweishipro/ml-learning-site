# 🧠 ML 学习站 (ml-learning)

> 一站式中文机器学习学习平台 —— 从入门到 LLM, 涵盖 15 门课程 52 章, 40+ 公开特性, 全栈开源。

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748)](https://www.prisma.io)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![版本](https://img.shields.io/badge/release-v14.3-FF6B6B)](https://github.com/chenweishipro/ml-learning-site/releases)

## ✨ 特性一览

平台从 v8 起持续迭代, 已积累 **40+ 公开特性**, 涵盖学习、社区、闭环、稳定、增长、监控、域名、LLM 8 大主题。

### 🎓 学习引擎 (v9)
- 🤖 **AI 答疑 2.0** —— RAG 检索 + LLM 解释, 带来源引文
- 🐍 **Python 沙箱** —— Monaco 编辑器 + Pyodide 浏览器跑 Python
- 🧩 **编程题系统** —— 20+ 题, 8 种数据类型
- 🗺️ **学习路线图** —— 3 条路径推荐
- 🏆 **Capstone 实战** —— 6 个综合项目
- 📖 **术语表 (Glossary)** —— 100+ 概念, 悬停即看
- 🎖️ **徽章成就** —— 15+ 枚, 进度可视化
- 🔑 **登录注册** —— email + 邀请码

### 🌐 学习社区 (v10)
- 👤 **公开用户主页** —— 学习统计、徽章墙、内容列表
- 💬 **嵌套评论** —— 楼中楼, Markdown 支持
- 🤖 **AI 出题** —— 一键基于章节生成 quiz
- ✏️ **资料编辑** —— admin 可改章节, 保留版本
- 🔔 **通知中心** —— 实时通知 + 已读未读
- 🫂 **学习圈** —— follow / 粉丝 / 推荐
- 💭 **匿名 chat** —— 免登录也能体验

### 🔄 学习闭环 (v11)
- 📥 **章节下载** —— MD / Text / HTML 三种格式
- 📊 **章节质量报告** —— admin 8 维评分
- 📱 **PWA 安装 + 离线** —— 7 天去重提示

### 🛠️ 打磨稳定 (v12)
- ✨ **错题 AI 讲解** —— 24h 缓存, 三段结构
- 🎁 **邀请码系统** —— 8 字符 base32, 4 枚徽章
- 🐧 **systemd 守护** —— 5s 自动拉起

### 🚀 增长 + 监控 + 域名 (v13)
- 📚 **3 门新课 11 章** —— NLP / 时间序列 / MLOps
- 📧 **邮件简报周报** —— 紫粉渐变 HTML, 每周一推送
- 📊 **监控告警** —— 13 指标 + Slack/钉钉 webhook
- 🌐 **域名 + HTTPS** —— TLS 1.2/1.3 + HSTS + 限流

### 🤖 LLM 入门 (v14.1)
- 🧠 **Transformer 基础** —— Self-Attention / Q-K-V / Multi-Head
- 🏋️ **预训练** —— Next-token / 三阶段 / Scaling Law / LoRA
- ✍️ **Prompt Engineering** —— 5 基础 + Function Call + 5 错误
- 🔍 **RAG** —— 检索增强 / 向量化 / Re-ranking / HyDE

### 📊 Admin 增强 (v14.2)
- 🎯 **平台概览仪表板** —— 7 卡片 + 3 排行, 一眼看全平台

### 🔧 CI/CD (v14.3)
- 🤖 **PR 模板** —— 改动类型 + 测试 checklist

## 📚 课程目录 (15 门 / 52 章)

| # | 课程 | 章数 | 简介 |
|---|-----|------|------|
| 1 | ML 基础 | 6 | 监督 / 无监督 / 强化学习入门 |
| 2 | 监督学习 | 4 | 回归 / 分类 / 决策树 / SVM |
| 3 | 神经网络 | 4 | 感知机 / BP / CNN / RNN |
| 4 | 深度学习进阶 | 3 | GAN / Transformer / 优化 |
| 5 | 强化学习 | 2 | Q-Learning / 策略梯度 |
| 6 | 统计基础 | 4 | 描述统计 / 抽样 / 分布 |
| 7 | 统计概率 | 3 | 贝叶斯 / 条件概率 |
| 8 | 统计连续 | 2 | 正态 / 中心极限定理 |
| 9 | 统计估计 | 1 | 点估计 / 区间估计 |
| 10 | 统计检验 | 4 | t 检验 / 卡方 / ANOVA |
| 11 | 统计回归 | 4 | 线性 / Logistic / Ridge |
| 12 | NLP 基础 | 4 | 预处理 / TF-IDF / Word2Vec / 情感分析 |
| 13 | 时间序列 | 4 | 基础 / ARIMA / Prophet / 异常检测 |
| 14 | MLOps | 3 | 模型版本 / 部署 / 监控漂移 |
| 15 | **LLM 入门** | 4 | Transformer / 预训练 / Prompt / RAG |

## 🛠️ 技术栈

- **前端**: Next.js 14 (App Router) + TypeScript 5 + Tailwind CSS 3
- **内容**: MDX (next-mdx-remote) + 自定义 Component
- **数据库**: Prisma 5 + SQLite (生产: 绝对路径)
- **认证**: cookie session (httpOnly, sameSite=lax)
- **AI**: MiniMax API (MiniMax-Text-01) + 本地 embedding 缓存
- **Python**: Pyodide 0.24 (浏览器内 Python 解释器)
- **PWA**: Service Worker + Web App Manifest
- **监控**: /api/metrics Prometheus 8 指标 + crontab */5
- **部署**: systemd 守护 + nginx 80/443 + certbot (HTTPS)
- **CDN**: 静态资源 1 年 immutable 缓存

## 📁 项目结构

```
ml-learning/
├── app/                    # Next.js App Router
│   ├── api/                # 50+ API routes
│   │   ├── admin/          # admin 后台
│   │   ├── auth/           # 登录注册
│   │   ├── chat/ sessions/ # AI 对话
│   │   ├── newsletter/     # 邮件简报
│   │   ├── quiz/           # 测验
│   │   ├── health/         # 健康检查
│   │   └── metrics/        # Prometheus
│   ├── courses/            # 课程页面
│   ├── me/                 # 个人中心
│   ├── admin/              # 管理后台
│   ├── playground/         # 编程 playground
│   └── search/ qa/ chat/   # 各种功能
├── content/courses/        # 15 门课程 MDX
├── components/             # React 组件
├── lib/                    # 工具库
│   ├── auth, db, llm       # 核心
│   ├── newsletter          # v13.2
│   ├── badges              # v9.7
│   └── ...
├── prisma/                 # schema + db
├── public/                 # 静态资源
├── scripts/                # 运维脚本
│   ├── install-systemd.sh
│   ├── setup-https.sh
│   ├── monitor.sh
│   └── newsletter-cron.sh
└── .github/                # PR 模板
```

## 🚀 本地开发

```bash
# 1. 装依赖
npm install

# 2. 初始化数据库
npx prisma db push
npx prisma generate

# 3. 跑 dev server
npm run dev
# 打开 http://localhost:3000
```

## 🐳 生产部署

```bash
# 1. 构建
npx next build

# 2. standalone 打包
tar --exclude='./node_modules' \
    --exclude='./.next/cache' \
    --exclude='./prisma/dev.db*' \
    --exclude='./.git' \
    -czf ml-site.tar.gz .

# 3. 服务器
ssh ubuntu@SERVER
sudo systemctl stop ml-learning
rm -rf /opt/ml-learning/.next/standalone
cd /opt/ml-learning && tar xzf ml-site.tar.gz
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/
sudo systemctl start ml-learning
```

详细流程见 `scripts/` 目录:
- `install-systemd.sh` —— 一键装 systemd 服务
- `setup-https.sh` —— 一键申请 certbot 证书
- `monitor.sh` —— 健康检查 + 告警
- `newsletter-cron.sh` —— 每周一 9 点推邮件

## 🌐 访问方式

生产部署支持:
- ✅ **IP 直连** —— `http://SERVER_IP:7892`
- ✅ **nginx 80 兜底** —— `http://SERVER_IP` (server_name _)
- ✅ **HTTPS** —— `https://DOMAIN` (用 setup-https.sh 一键申请)

## 📊 监控

```bash
# 健康检查
curl http://SERVER:7892/api/health/

# Prometheus 指标
curl http://SERVER:7892/api/metrics/

# 监控 cron
crontab -l | grep monitor
# */5 * * * * /opt/ml-learning/scripts/monitor.sh

# 日志
journalctl -u ml-learning --no-pager -n 50
```

## 📜 变更日志

| 版本 | 主题 | 关键特性 |
|------|------|---------|
| v14.3 | CI/CD | PR 模板 |
| v14.2 | Admin 增强 | 平台概览仪表板 |
| v14.1 | LLM 入门 | Transformer / 预训练 / Prompt / RAG |
| v13.4 | 域名 + HTTPS | certbot 一键申请 |
| v13.3 | 监控告警 | Prometheus 8 指标 + webhook |
| v13.2 | 邮件简报 | 紫粉渐变 HTML 周报 |
| v13.1 | 内容扩展 | NLP / 时间序列 / MLOps 3 门新课 |
| v12.3 | 守护稳定 | systemd 5s 拉起 |
| v12.2 | 邀请码 | 4 枚事件徽章 |
| v12.1 | AI 讲解 | 错题三段解释 |
| v11.3 | PWA | install prompt + 离线 |
| v11.1 | 章节下载 | MD/Text/HTML |
| v10.7 | 匿名 chat | 免登录 |
| v10.4 | 资料编辑 | admin 改章节 |
| v9.7 | 徽章系统 | 15+ 枚成就 |
| v9.5 | Capstone | 6 个实战项目 |
| v9.2 | 编程题 | 20+ 题 8 类型 |
| v9.1 | Monaco | 浏览器 Python |
| v8.7 | i18n | 中英双语 |
| v8.6 | FTS5 | 全文搜索高亮 |

## 🤝 贡献

欢迎 PR! 请先看 [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md)

## 📄 License

MIT © 2026 ml-learning
