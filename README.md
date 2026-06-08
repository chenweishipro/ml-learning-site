# ML 学习站 · 中文机器学习教程

一个完整的**中文机器学习学习网站**,从零基础到深度学习,系统化课程 + 可运行代码 + 交互可视化。

## ✨ 特性

- 📚 **5 门系统化课程,23 个章节**:机器学习入门 → 监督学习 → 神经网络 → 深度学习进阶 → 强化学习
- 🎮 **6 个交互式可视化组件**:梯度下降、线性回归、K-Means、混淆矩阵、决策树、神经网络 Playground
- 🐍 **浏览器内 Python**(Pyodide):免安装,直接在网页跑代码
- 🔍 **全文搜索**:跨课程章节内容检索
- 🌗 **暗色模式**:跟随系统 / 手动切换,带本地存储
- ✅ **学习进度追踪**:章节标记完成,实时进度条
- 📐 **数学公式渲染**:KaTeX 支持

## 🛠 技术栈

- **Next.js 14** (App Router, 静态导出)
- **TypeScript**
- **Tailwind CSS**
- **MDX** (next-mdx-remote)
- **Pyodide** (浏览器 Python)
- **KaTeX** (数学公式)

## 🚀 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# → http://localhost:3000

# 静态导出构建
npm run build
# 输出到 ./out 目录
```

## 📁 目录结构

```
app/                  # Next.js App Router 页面
components/           # 复用组件
  ├── interactive/    # 6 个交互式可视化组件
  ├── layout/         # Header / Footer
  ├── ui/             # 基础 UI 组件
  └── ...
content/courses/      # MDX 课程内容
  ├── _index.ts       # 5 门课程索引
  ├── ml-basics/      # 入门(5 章)
  ├── supervised-learning/   # 监督学习(4 章)
  ├── neural-networks/       # 神经网络(4 章)
  ├── deep-learning-advanced/ # 深度学习进阶(5 章)
  └── reinforcement-learning/  # 强化学习(5 章)
lib/                  # 工具与数据
  ├── content.ts      # 课程 / 章节数据加载
  ├── quizzes.ts      # 章节测验题库
  ├── search.ts       # 搜索索引
  └── utils.ts
```

## 🚢 部署

静态导出 (`output: "export"`),可直接放到任何静态文件服务下:
- Nginx / Caddy / Apache
- Vercel / Netlify / Cloudflare Pages
- 腾讯云 / 阿里云 OSS

## 📄 许可

MIT
