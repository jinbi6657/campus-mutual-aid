import { configureAiFromEnv } from "../../../src/lib/ai";
import { runAiCoach, type AiDraftInput } from "../../../src/lib/ai-tasks";

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

  const body = (await context.request.json().catch(() => ({}))) as AiDraftInput;
  const result = await runAiCoach(body);

  if (result.fallback) {
    return json({ fallback: true, error: result.error });
  }
  return json({
    fallback: false,
    coach: result.coach,
    metrics: result.metrics,
  });
}
