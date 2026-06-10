"use client";
import {
  BookOpenCheck,
  Code2,
  Layers,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";
import { Translate } from "@/components/translate";

interface FeatureItem {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  descZh: string;
  titleZh: string;
}

const features: FeatureItem[] = [
  {
    icon: Layers,
    titleKey: "home.pillarSystemTitle",
    descKey: "home.pillarSystemDesc",
    titleZh: "系统化课程",
    descZh: "从 Python 与 NumPy 基础到深度学习, 知识点层层递进, 不会再学完即忘。",
  },
  {
    icon: Code2,
    titleKey: "home.pillarCodeTitle",
    descKey: "home.pillarCodeDesc",
    titleZh: "可运行代码",
    descZh: "所有示例均提供完整可执行代码, 支持本地与 Colab 双环境, 边学边练。",
  },
  {
    icon: LineChart,
    titleKey: "home.pillarVizTitle",
    descKey: "home.pillarVizDesc",
    titleZh: "可视化讲解",
    descZh: "用图表拆解抽象概念: 损失函数、梯度下降、模型评估, 一看就懂。",
  },
  {
    icon: BookOpenCheck,
    titleKey: "home.pillarProgressiveTitle",
    descKey: "home.pillarProgressiveDesc",
    titleZh: "渐进式学习",
    descZh: "从入门到进阶, 每章都有清晰的目标、习题与小结, 难度坡度平缓。",
  },
];

export function Features() {
  const { t } = useI18n();

  return (
    <section className="container py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-display-sm font-bold tracking-tight">
          <Translate text="为什么选择" /> <span className="text-gradient-primary"><Translate text="ML 学习站" /></span>
        </h2>
        <p className="mt-3 text-neutral-600">{t("home.whySubtitle")}</p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <Card key={f.titleZh} hoverable className="p-6">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-primary-50 text-primary-700 ring-1 ring-primary-100">
              <f.icon className="h-5 w-5" />
            </div>
            <CardTitle className="mt-4">{t(f.titleKey)}</CardTitle>
            <CardDescription>{t(f.descKey)}</CardDescription>
          </Card>
        ))}
      </div>
    </section>
  );
}