import {
  BookOpenCheck,
  Code2,
  Layers,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

const features: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Layers,
    title: "系统化课程",
    desc: "从 Python 与 NumPy 基础到深度学习, 知识点层层递进, 不会再学完即忘。",
  },
  {
    icon: Code2,
    title: "可运行代码",
    desc: "所有示例均提供完整可执行代码, 支持本地与 Colab 双环境, 边学边练。",
  },
  {
    icon: LineChart,
    title: "可视化讲解",
    desc: "用图表拆解抽象概念: 损失函数、梯度下降、模型评估, 一看就懂。",
  },
  {
    icon: BookOpenCheck,
    title: "渐进式学习",
    desc: "从入门到进阶, 每章都有清晰的目标、习题与小结, 难度坡度平缓。",
  },
];

export function Features() {
  return (
    <section className="container py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-display-sm font-bold tracking-tight">
          为什么选择 <span className="text-gradient-primary">ML 学习站</span>
        </h2>
        <p className="mt-3 text-neutral-600">
          围绕"学得会、做得出来"的目标, 我们精心设计了四大学习体验。
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, desc }) => (
          <Card key={title} hoverable className="p-6">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-primary-50 text-primary-700 ring-1 ring-primary-100">
              <Icon className="h-5 w-5" />
            </div>
            <CardTitle className="mt-4">{title}</CardTitle>
            <CardDescription>{desc}</CardDescription>
          </Card>
        ))}
      </div>
    </section>
  );
}
