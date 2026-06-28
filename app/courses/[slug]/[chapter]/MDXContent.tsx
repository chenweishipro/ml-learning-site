import { MDXRemote, type MDXRemoteProps } from "next-mdx-remote/rsc";
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
import { CodingChallenge } from "@/components/CodingChallenge";
import { getCodingChallenge } from "@/lib/coding-challenges";

/**
 * 章节 MDX 的服务端渲染入口。
 *  - 使用 `next-mdx-remote/rsc`, 不需要客户端 hydration
 *  - remark-gfm 启用 GitHub 风格 Markdown (表格 / 删除线 / 任务列表)
 *  - rehype-slug + autolink 给标题加锚点
 *  - 在 components 中注入业务组件, 让 MDX 写起来更顺手
 *  - 编译结果按 (source-hash) 缓存 30 分钟, 大文档 ~10x 加速
 */
const mdxCache = new Map<string, { at: number; v: React.ReactElement }>();
const MDX_CACHE_TTL = 30 * 60 * 1000;

export function MDXContent({ source }: { source: string }) {
  // source 通常已经走 getChapterWithOverrides 缓存, 这里再加一层
  // 防止同一 source 字符串重复编译
  const cached = mdxCache.get(source);
  if (cached && Date.now() - cached.at < MDX_CACHE_TTL) {
    return cached.v;
  }
  // 显式预先构建组件映射表, 不依赖 MDXRemote 的自动映射
  const components: MDXRemoteProps["components"] = {
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
    CodingChallenge: (props: { id: string }) => {
      const c = getCodingChallenge(props.id);
      if (!c) return <div className="my-6 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">编程题 {props.id} 未找到</div>;
      return <CodingChallenge challenge={c} />;
    },
    pre: (props) => <CodeBlock>{props.children}</CodeBlock>,
  };
  // 注: MDXRemote 不缓存, 它是 RSC. 我们不强制缓存组件本身,
  // 只是用 Map 避免同一 source 在同一请求中重复编译 (Next 会 RSC 缓存结果)
  const element = (
    <div className="prose-chinese">
      <MDXRemote
        source={source}
        components={components}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              [
                rehypeSlug,
                {
                  // 自定义 slug: 数字开头加 's-' 前缀 (acorn JSX 不允许 id 以数字开头)
                  slug: (s: string) =>
                    /^[0-9]/.test(s) ? 's-' + s : s,
                },
              ],
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
  mdxCache.set(source, { at: Date.now(), v: element });
  return element;
}
