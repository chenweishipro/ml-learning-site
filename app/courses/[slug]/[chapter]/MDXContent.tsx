import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";
import {
  LinearRegressionViz,
  GradientDescent,
  KMeansViz,
  ConfusionMatrixViz,
  DecisionTreeViz,
  NeuralNetPlayground,
} from "@/components/interactive";
import { Math, M, MBlock } from "@/components/math";
import { Quiz } from "@/components/quiz";
import { PythonRunner } from "@/components/python-runner";

/**
 * 章节 MDX 的服务端渲染入口。
 *  - 使用 `next-mdx-remote/rsc`, 不需要客户端 hydration
 *  - remark-gfm 启用 GitHub 风格 Markdown (表格 / 删除线 / 任务列表)
 *  - rehype-slug + autolink 给标题加锚点
 *  - 在 components 中注入业务组件, 让 MDX 写起来更顺手
 */
export function MDXContent({ source }: { source: string }) {
  return (
    <div className="prose-chinese">
      <MDXRemote
        source={source}
        components={{
          Callout,
          CodeBlock,
          LinearRegressionViz,
          GradientDescent,
          KMeansViz,
          ConfusionMatrixViz,
          DecisionTreeViz,
          NeuralNetPlayground,
          Math,
          M,
          MBlock,
          Quiz,
          PythonRunner,
          pre: (props) => <CodeBlock>{props.children}</CodeBlock>,
        }}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeSlug,
              [
                rehypeAutolinkHeadings,
                {
                  behavior: "wrap",
                  properties: { className: ["anchor"] },
                },
              ],
            ],
          },
        }}
      />
    </div>
  );
}
