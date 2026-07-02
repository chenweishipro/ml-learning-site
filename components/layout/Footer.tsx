"use client";
import Link from "next/link";
import { Github, Mail, Heart, GraduationCap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Translate } from "@/components/translate";

interface FooterLink {
  labelKey: string;
  labelZh: string;
  href: string;
}

interface FooterSection {
  titleKey: string;
  titleZh: string;
  links: FooterLink[];
}

const sections: FooterSection[] = [
  {
    titleKey: "footer.learn",
    titleZh: "学习",
    links: [
      { labelKey: "footer.courseCatalog", labelZh: "课程目录", href: "/courses/" },
      { labelKey: "footer.searchCourses", labelZh: "搜索课程", href: "/search/" },
      { labelKey: "footer.playground", labelZh: "交互演示", href: "/playground/" },
      { labelKey: "footer.aboutSite", labelZh: "关于本站", href: "/about/" },
    ],
  },
  {
    titleKey: "footer.courses",
    titleZh: "课程",
    links: [
      { labelKey: "", labelZh: "机器学习入门", href: "/courses/ml-basics/" },
      { labelKey: "", labelZh: "监督学习进阶", href: "/courses/supervised-learning/" },
      { labelKey: "", labelZh: "神经网络入门", href: "/courses/neural-networks/" },
      { labelKey: "", labelZh: "深度学习进阶", href: "/courses/deep-learning-advanced/" },
      { labelKey: "", labelZh: "强化学习入门", href: "/courses/reinforcement-learning/" },
    ],
  },
  {
    titleKey: "footer.tools",
    titleZh: "工具",
    links: [
      { labelKey: "footer.pythonPlayground", labelZh: "Python 演练场", href: "/playground/python/" },
      { labelKey: "footer.chapterQuiz", labelZh: "章末小测验", href: "/courses/ml-basics/what-is-ml/" },
    ],
  },
];

export function Footer() {
  const { t } = useI18n();
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
                ML <span className="text-primary-600"><Translate text="学习站" /></span>
              </span>
            </Link>
            <p className="max-w-sm text-sm text-neutral-600 leading-relaxed dark:text-neutral-400">
              {t("footer.description")}
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
                aria-label="Mail"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {sections.map((s) => (
              <div key={s.titleZh}>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {s.titleKey ? t(s.titleKey) : <Translate text={s.titleZh} />}
                </h4>
                <ul className="mt-3 space-y-2 text-sm">
                  {s.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-neutral-600 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-300"
                      >
                        {l.labelKey ? t(l.labelKey) : <Translate text={l.labelZh} />}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-neutral-200 pt-6 text-xs text-neutral-500 sm:flex-row dark:border-neutral-800 dark:text-neutral-400">
          <span>© {new Date().getFullYear()} ML <Translate text="学习站" /> · <Translate text="保留所有权利" /></span>
          <span className="inline-flex items-center gap-1">
            <Translate text="用" /> <Heart className="h-3 w-3 text-rose-500" /> <Translate text="与 Next.js 14 制作" />
          </span>
        </div>
      </div>
    </footer>
  );
}