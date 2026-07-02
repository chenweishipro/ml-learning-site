import { Hero } from "@/components/home/Hero";
import { Features } from "@/components/home/Features";
import { CoursePreviewServer } from "@/components/home/CoursePreviewServer";
import { Stats } from "@/components/home/Stats";
import { CTA } from "@/components/home/CTA";
import { TodayStudyBanner } from "@/components/home/TodayStudyBanner";
import { JsonLd, FaqJsonLd } from "@/components/seo/JsonLd";

export default function HomePage() {
  const faqs = [
    {
      q: "ML 学习站适合什么背景的读者？",
      a: "从零基础入门到进阶深度学习 — 站内有 19 门课、68+ 章中文教程。从机器学习入门到监督学习、神经网络、深度学习、推荐系统、计算机视觉、强化学习、AutoML 等都有覆盖。",
    },
    {
      q: "课程内容是免费的吗？",
      a: "是的。ML 学习站所有课程、代码、互动演示均完全免费, 无需注册即可阅读。注册账号后可以同步学习进度、错题、笔记、打卡记录。",
    },
    {
      q: "需要什么样的 Python 基础？",
      a: "入门课程会从 Python 基础讲起。如果你已有 Python 经验, 可以跳过基础章节直接进入 NumPy、Pandas、机器学习部分。",
    },
    {
      q: "课程包含互动演示吗？",
      a: "是的。站内提供 Python 在线演练场 (浏览器中直接运行), 以及多门课的交互式可视化、章末小测验, 帮助你学以致用。",
    },
  ];

  return (
    <>
      {/* 首页 FAQ 结构化数据 */}
      <JsonLd data={FaqJsonLd({ faqs })} />
      <Hero />
      <TodayStudyBanner />
      <Features />
      <CoursePreviewServer />
      <Stats />
      <CTA />
    </>
  );
}
