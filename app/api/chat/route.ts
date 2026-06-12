// AI 答疑 API v2 — 多轮对话 + 持久化
// POST /api/chat  body: { sessionId?, query, topK?, stream? }
//   - 如果有 sessionId, 加载历史消息作为 context, 然后把 user/assistant 都存进去
//   - 默认 stream=true
//   - 首条消息自动拿 query 截前 30 字作为 session 标题
import { ragChat, ragChatStream } from "@/lib/rag";
import { ok, fail } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getSession, createSession, appendMessage, renameSession, type Citation } from "@/lib/chat-sessions";
import type { ChatSource } from "@/lib/rag";
import type { LLMMessage } from "@/lib/llm";

export const runtime = "nodejs";

interface ChatRequest {
  sessionId?: string;
  query: string;
  topK?: number;
  stream?: boolean;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401);

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return fail("Invalid JSON", 400);
  }
  if (!body.query?.trim()) {
    return fail("query is required", 400);
  }

  // 拿/建 session
  let sessionId = body.sessionId;
  if (!sessionId) {
    const s = await createSession(user.id, body.query.slice(0, 30));
    sessionId = s.id;
  } else {
    // 验证 session 属于该 user
    const s = await getSession(user.id, sessionId);
    if (!s) return fail("Session 不存在", 404);
  }
  // 存 user message
  await appendMessage(user.id, sessionId, "user", body.query);

  // 拿历史 (最近 10 条)
  const sess = await getSession(user.id, sessionId);
  const history: LLMMessage[] = (sess?.messages ?? [])
    .slice(-10)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  // 流式响应 (默认)
  if (body.stream !== false) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };
        let fullAnswer = "";
        let citations: Citation[] = [];
        try {
          for await (const event of ragChatStream({
            query: body.query,
            history,
            topK: body.topK ?? 3,
          })) {
            if (event.type === "chunk") {
              fullAnswer += String(event.data);
            } else if (event.type === "sources") {
              const raw = event.data as ChatSource[];
              citations = raw.map((s) => ({
                courseSlug: s.courseSlug,
                courseTitle: s.courseTitle,
                chapterSlug: s.chapterSlug,
                chapterTitle: s.chapterTitle,
                snippet: s.excerpt,
                score: s.score,
              }));
            }
            send({ type: event.type, data: event.data, sessionId });
          }
          // 存 assistant message
          await appendMessage(user.id, sessionId!, "assistant", fullAnswer, citations);
        } catch (e) {
          send({ type: "error", data: e instanceof Error ? e.message : "AI 答疑失败", sessionId });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  // 非流式
  try {
    const result = await ragChat({
      query: body.query,
      history,
      topK: body.topK ?? 3,
    });
    const citations = result.sources.map((s) => ({
      courseSlug: s.courseSlug,
      courseTitle: s.courseTitle,
      chapterSlug: s.chapterSlug,
      chapterTitle: s.chapterTitle,
      snippet: s.excerpt,
      score: s.score,
    }));
    await appendMessage(user.id, sessionId!, "assistant", result.answer, citations);
    return ok({ ...result, sessionId });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "AI 答疑失败", 500);
  }
}

// GET 拿推荐问题列表
export async function GET() {
  return ok({
    suggestions: [
      "什么是过拟合? 怎么避免?",
      "机器学习和深度学习的区别是什么?",
      "贝叶斯定理在 ML 里怎么用?",
      "如何选择模型评估指标?",
      "RNN 和 Transformer 的核心区别?",
      "中心极限定理为什么重要?",
      "如何用 Python 调通一个最小神经网络?",
    ],
  });
}
