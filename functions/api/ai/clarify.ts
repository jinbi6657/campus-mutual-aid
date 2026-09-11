import { configureAiFromEnv } from "../../../src/lib/ai";
import { runAiClarify } from "../../../src/lib/ai-tasks";

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
    text?: string;
  };
  const text = (body.text ?? "").trim();

  if (!text) {
    return json({ fallback: true, error: "缺少文本" });
  }

  const result = await runAiClarify(text);
  if (result.fallback) {
    return json({ fallback: true, error: result.error });
  }
  return json({
    fallback: false,
    needClarify: result.needClarify,
    reason: result.reason,
    questions: result.questions,
    metrics: result.metrics,
  });
}
