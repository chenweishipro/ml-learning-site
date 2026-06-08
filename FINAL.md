# ML 学习站 · 最终交付物

## 概述

一个完整、可运行的中文机器学习学习网站,采用 Next.js 14 + TypeScript + Tailwind CSS + MDX 技术栈。

## 已实现功能

### 1. 项目骨架
- Next.js 14 App Router + TypeScript + Tailwind CSS 4
- 完整的设计系统(蓝紫主色 / 青色强调 / 中文字体栈 / 暗色模式预留)
- 自定义 UI 组件:Button、Card、CodeBlock、Callout、ProgressBar、Badge
- 布局组件:Header(含移动端汉堡菜单)、Nav、Footer
- MDX 渲染管道(next-mdx-remote + remark-gfm + rehype-slug)

### 2. 课程内容(3 门课,共 13 章)
- **机器学习入门** (5 章)
  - 什么是机器学习
  - 机器学习的分类
  - 第一个模型:线性回归
  - 如何评估模型
  - 过拟合与欠拟合
- **监督学习进阶** (4 章)
  - 逻辑回归
  - 决策树
  - 支持向量机
  - 集成学习
- **神经网络与深度学习入门** (4 章)
  - 从感知机到神经网络
  - 反向传播算法
  - 激活函数与损失函数
  - 训练神经网络的技巧

每章内容包含:概念解释 + Python 代码示例 + 数学公式(纯文本形式) + 关键概念加粗 + 章节小结 + 练习思考。

### 3. 交互式可视化(3 个组件)
- **梯度下降可视化** `/playground`:可调学习率和起始点,动画展示在 f(x)=x² 上的迭代过程
- **线性回归拟合** `/playground`:可调斜率/截距/数据点/噪声,实时计算 MSE;同时嵌入到 first-model 章节
- **K-Means 聚类** `/playground`:可调 K 值和初始化方式,动画展示聚类迭代

### 4. 核心页面
- `/` 着陆页:大 Hero、特性卡片、课程预览、数据展示
- `/courses` 课程列表(带搜索/难度筛选)
- `/courses/[slug]` 课程详情(章节目录)
- `/courses/[slug]/[chapter]` 章节学习(左侧导航 + 右侧 MDX 内容 + 进度条)
- `/playground` 交互演示集中页
- `/about` 关于页
- `/_not-found` 404 页

## 技术栈

- **框架**:Next.js 14.2.18 (App Router)
- **语言**:TypeScript 5.6
- **样式**:Tailwind CSS 3.4
- **内容**:MDX (next-mdx-remote 5)
- **图标**:lucide-react
- **代码高亮**:内置 CodeBlock 组件

## 目录结构

```
ml-site/
├── app/
│   ├── layout.tsx                    全局 layout (含 Header/Footer)
│   ├── page.tsx                      着陆页
│   ├── globals.css
│   ├── not-found.tsx                 404 页
│   ├── about/page.tsx                关于页
│   ├── playground/page.tsx           交互演示集中页
│   └── courses/
│       ├── page.tsx                  课程列表
│       ├── CourseExplorer.tsx        客户端筛选器
│       └── [slug]/
│           ├── page.tsx              课程详情
│           └── [chapter]/
│               ├── page.tsx          章节学习
│               ├── ChapterSidebar.tsx
│               └── MDXContent.tsx    MDX 渲染
├── components/
│   ├── layout/   (Header, Nav, Footer)
│   ├── ui/       (Button, Card, CodeBlock, Callout, ProgressBar, Badge)
│   ├── home/     (Hero, Features, CoursePreview, Stats, CTA)
│   └── interactive/   (LinearRegressionViz, GradientDescent, KMeansViz)
├── content/
│   └── courses/
│       ├── _index.ts                 课程元数据索引
│       ├── ml-basics/                5 个 MDX
│       ├── supervised-learning/      4 个 MDX
│       └── neural-networks/          4 个 MDX
├── lib/
│   ├── content.ts                    MDX 加载工具
│   └── utils.ts                      cn / formatDuration
├── public/
├── tailwind.config.ts                 设计系统
├── next.config.mjs
└── package.json
```

## 本地开发

```bash
cd ml-site
npm install          # 安装依赖
npm run dev          # 启动开发服务器 (http://localhost:3000)
npm run build        # 生产构建
npm run start        # 启动生产服务器
```

## 测试结果

- `npm run build` ✅ 0 错误,23 个静态页面全部生成
- 所有核心页面 HTTP 200:
  - `/`
  - `/courses`
  - `/courses/ml-basics`
  - `/courses/ml-basics/first-model` (含 LinearRegressionViz 嵌入)
  - `/playground` (3 个交互组件)
  - `/about`
- 不存在的路径正确返回 404
- 中文内容正常渲染

## 部署

适合部署到 Vercel / Netlify / Cloudflare Pages 等静态托管平台:

```bash
# 静态导出
NEXT_OUTPUT=export npm run build
# 输出在 out/ 目录,直接上传到任何静态托管
```

## 已知限制 / TODO

- 没有真实 LaTeX 渲染(数学公式用纯文本形式,牺牲了排版美感换 MDX 兼容性)
- 没有真实执行 Python 代码的功能(代码示例仅作展示)
- 没有用户进度跟踪(下次刷新会丢失阅读位置)
- 没有搜索功能(只支持课程列表的难度筛选)
- 数据持久化暂无(没有用户收藏/笔记功能)
- 移动端交互组件可以再优化(目前 SVG 在小屏上略拥挤)

## 课程贡献指南

要新增课程,只需:
1. 在 `content/courses/<slug>/` 下添加章节 MDX 文件
2. 在 `content/courses/_index.ts` 的 `courses` 数组中添加 `CourseMeta`
3. `lib/content.ts` 会自动暴露到 API,无需重启

## 许可证

MIT
