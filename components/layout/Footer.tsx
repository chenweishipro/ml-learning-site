import Link from "next/link";
import { Github, Mail, Heart, GraduationCap, Search, Terminal } from "lucide-react";

const sections = [
  {
    title: "学习",
    links: [
      { label: "课程目录", href: "/courses" },
      { label: "搜索课程", href: "/search" },
      { label: "交互演示", href: "/playground" },
      { label: "关于本站", href: "/about" },
    ],
  },
  {
    title: "课程",
    links: [
      { label: "机器学习入门", href: "/courses/ml-basics" },
      { label: "监督学习进阶", href: "/courses/supervised-learning" },
      { label: "神经网络入门", href: "/courses/neural-networks" },
      { label: "深度学习进阶", href: "/courses/deep-learning-advanced" },
      { label: "强化学习入门", href: "/courses/reinforcement-learning" },
    ],
  },
  {
    title: "工具",
    links: [
      { label: "Python 演练场", href: "/playground/python" },
      { label: "章末小测验", href: "/courses/ml-basics/what-is-ml" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-neutral-200 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-950/60">
      <div className="container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_3fr]">
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-50"
            >
              <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-primary text-white">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="text-lg">
                ML <span className="text-primary-600">学习站</span>
              </span>
            </Link>
            <p className="max-w-sm text-sm text-neutral-600 leading-relaxed dark:text-neutral-400">
              面向中文读者的机器学习学习平台。从零开始, 循序渐进地掌握数据处理、建模与深度学习的核心能力。
            </p>
            <div className="flex items-center gap-3 text-neutral-500">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer noopener"
                className="grid h-9 w-9 place-items-center rounded-md ring-1 ring-neutral-200 hover:text-primary-600 hover:ring-primary-300 dark:ring-neutral-800 dark:hover:text-primary-300 dark:hover:ring-primary-700"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@example.com"
                className="grid h-9 w-9 place-items-center rounded-md ring-1 ring-neutral-200 hover:text-primary-600 hover:ring-primary-300 dark:ring-neutral-800 dark:hover:text-primary-300 dark:hover:ring-primary-700"
                aria-label="电子邮件"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {sections.map((s) => (
              <div key={s.title}>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {s.title}
                </h4>
                <ul className="mt-3 space-y-2 text-sm">
                  {s.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-neutral-600 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-300"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-neutral-200 pt-6 text-xs text-neutral-500 sm:flex-row dark:border-neutral-800 dark:text-neutral-400">
          <span>© {new Date().getFullYear()} ML 学习站 · 保留所有权利</span>
          <span className="inline-flex items-center gap-1">
            用 <Heart className="h-3 w-3 text-rose-500" /> 与 Next.js 14 制作
          </span>
        </div>
      </div>
    </footer>
  );
}
