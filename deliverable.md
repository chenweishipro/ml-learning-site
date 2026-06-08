# ML 学习站 · 项目骨架交付物

## 完成的功能

### 设计系统
- ✅ 蓝紫主色 (primary 50–950) + 青色强调 (accent 50–900) + 完整中性灰阶
- ✅ 中文优先系统字体栈 (`-apple-system`, `PingFang SC`, `Microsoft YaHei`)
- ✅ 5 档圆角 (8/12/16/20/24px)
- ✅ 暗色模式预留 (`class` 策略)
- ✅ 自定义 typography (`.prose-chinese` 适配中文阅读节奏)
- ✅ 渐变 / 阴影 / 动画令牌 (`.text-gradient-primary` / `.shadow-card` / `animate-fade-in-up`)

### 核心 UI 组件
- ✅ `Button` — 4 变体 × 3 尺寸, 自动支持 `href` 转 Link
- ✅ `Card` + 5 个子组件
- ✅ `CodeBlock` — 文件名/语言标签 + 复制按钮
- ✅ `Callout` — info / tip / warning / danger
- ✅ `ProgressBar` — 带百分比文字
- ✅ `Badge` — 4 配色变体

### 布局组件
- ✅ `Header` — Logo + Nav + 移动端汉堡菜单 + 桌面端 CTA
- ✅ `Nav` — 自动高亮当前路由, 支持水平/垂直两种布局
- ✅ `Footer` — 三栏 + 社交链接 + 版权

### 页面
- ✅ `/` 着陆页 — Hero / Features / CoursePreview / Stats / CTA
- ✅ `/courses` 课程列表 — 搜索 + 难度筛选 + 标签筛选 (空数据时优雅占位)
- ✅ `/courses/[slug]` 课程详情 — 头部信息 + 章节目录
- ✅ `/courses/[slug]/[chapter]` 章节学习 — 左侧 sidebar (含进度条) + 右侧 MDX + 上下章导航
- ✅ `/about` 关于页
- ✅ `/_not-found` 404 页

### MDX 渲染
- ✅ 服务端渲染 (`next-mdx-remote/rsc`)
- ✅ GitHub 风格 Markdown (GFM: 表格 / 任务列表 / 删除线)
- ✅ 标题自动加锚点
- ✅ 业务组件 (Callout / CodeBlock) 可在 MDX 中直接使用

### 内容系统
- ✅ `content/courses/_index.ts` 模板 (类型 + 字段说明)
- ✅ `lib/content.ts` API: `getAllCourses` / `getCourse` / `getChapter` / `getChapterNeighbors`
- ✅ 静态生成 (`generateStaticParams`) — 添加新课程后无需重启 dev server

## 文件结构概览

```
ml-site/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                   着陆页
│   ├── globals.css
│   ├── not-found.tsx
│   ├── about/page.tsx
│   └── courses/
│       ├── page.tsx               课程列表
│       ├── CourseExplorer.tsx     客户端筛选器
│       └── [slug]/
│           ├── page.tsx           课程详情
│           └── [chapter]/
│               ├── page.tsx       章节学习
│               ├── ChapterSidebar.tsx
│               └── MDXContent.tsx
├── components/
│   ├── layout/   (Header, Nav, Footer)
│   ├── ui/       (Button, Card, CodeBlock, Callout, ProgressBar, Badge)
│   └── home/     (Hero, Features, CoursePreview, Stats, CTA)
├── content/
│   └── courses/
│       └── _index.ts             课程元数据索引 (空模板, 待 content 任务填充)
├── lib/
│   ├── content.ts                MDX 加载工具
│   └── utils.ts                  cn / formatDuration / LEVEL_META
├── public/
├── tailwind.config.ts             设计系统核心
├── postcss.config.js
├── next.config.mjs
├── tsconfig.json
├── package.json
└── README.md
```

## 如何运行

```bash
# 1. 安装依赖
cd /workspace/ml-site
npm install

# 2. 本地开发
npm run dev
# → 访问 http://localhost:3000

# 3. 生产构建
npm run build

# 4. 预览生产构建
npm run start
```

> 最低 Node 版本: **18.18** (推荐 20+)

## 验证状态

| 验证项 | 结果 |
| --- | --- |
| `npm install` | ✅ 556 包安装成功 |
| `npm run build` | ✅ 6 个路由全部静态化 |
| 着陆页 HTTP 200 | ✅ |
| 课程列表页 HTTP 200 | ✅ |
| 课程详情页 HTTP 200 | ✅ (在添加课程后) |
| 章节页 HTTP 200 | ✅ (在添加课程 + MDX 后) |
| 关于页 HTTP 200 | ✅ |
| 未知课程 slug HTTP 404 | ✅ |
| 中文字符串渲染 | ✅ |
| 移动端响应式 | ✅ (Header 含汉堡菜单, 卡片网格在 sm/md/lg 自适应) |

## 已知限制 / TODO

1. **课程内容空缺** — `courses: CourseMeta[] = []` 为空, content 任务会填充
2. **暗色模式切换按钮** — 样式已通过 `class` 策略预留, 切换控件未实装
3. **MDX 代码高亮** — 已装 `shiki`, 但未在 MDX 管线启用以避免构建变慢; 需要时 5 行内可加 `rehype-pretty-code`
4. **课程搜索在客户端** — 课程量 < 100 时无压力, 大量时建议改为 server-side
5. **学习进度持久化** — `ProgressBar` 当前根据 URL 自动算百分比, 真实学习进度需 localStorage / 后端支持
6. **ESLint 警告** — `next 14.2.18` 有安全公告, 但 LTS 兼容, 未升级到 next 15 以保持稳定

## 后续任务交接说明

**content 任务** 只需:
1. 在 `content/courses/_index.ts` 追加 `CourseMeta` 记录
2. 在 `content/courses/<slug>/<chapter>.mdx` 放正文
3. 重启 dev server 或刷新页面 (Next.js 会自动重新加载 _index.ts)

**UI 任务** (如有) 可以:
- 在 `app/page.tsx` 调整 Hero 区块顺序
- 在 `tailwind.config.ts` 修改主色色相
- 在 `app/courses/CourseExplorer.tsx` 扩展筛选维度

**deploy 任务** (如有) 可以:
- 把 `next.config.mjs` 改为 `output: "export"`, 然后 `npm run build` 产物在 `out/`
- 部署到 Vercel / Netlify / 阿里云 OSS / GitHub Pages 均可
