import { configureAiFromEnv } from "../../../src/lib/ai";
import { runAiMatch, type Candidate } from "../../../src/lib/ai-tasks";

// Cloudflare Pages Functions 版本：路径与 Next 的 /api/ai/match 一致，
// 前端代码不用改，本地开发走 Next 路由，线上走这里。
interface Env {
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_BASE_URL?: string;
}

interface Context {
  request: Request;
  env: Env;
}

function json(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPost(context: Context): Promise<Response> {
  configureAiFromEnv(context.env);

  const body = (await context.request.json().catch(() => ({}))) as {
    query?: string;
    candidates?: Candidate[];
  };
  const query = (body.query ?? "").trim();
  const candidates = (body.candidates ?? []).slice(0, 200);

  if (!query || candidates.length === 0) {
    return json({ fallback: true, error: "缺少查询或候选" });
  }

  const result = await runAiMatch(query, candidates);
  if (result.fallback) {
    return json({ fallback: true, error: result.error });
  }
  return json({
    fallback: false,
    recommendations: result.recommendations,
    metrics: result.metrics,
    candidateCount: result.candidateCount,
    totalCandidates: result.totalCandidates,
  });
}
