export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCallResult {
  ok: boolean;
  content: string;
  model: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  costYuan: number;
  error?: string;
}

// 示意价格（元 / 百万 token），用于演示成本计算
const INPUT_PRICE_PER_MILLION = 2;
const OUTPUT_PRICE_PER_MILLION = 8;

export function hasAiKey(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export async function callDeepSeek(
  messages: AiMessage[],
  options?: { json?: boolean; temperature?: number; maxTokens?: number },
): Promise<AiCallResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

  if (!apiKey || apiKey.includes("粘贴")) {
    return {
      ok: false,
      content: "",
      model: "",
      latencyMs: 0,
      promptTokens: 0,
      completionTokens: 0,
      costYuan: 0,
      error: "未配置 DEEPSEEK_API_KEY",
    };
  }

  const started = Date.now();

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 800,
        ...(options?.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    const latencyMs = Date.now() - started;

    if (!response.ok) {
      const text = await response.text();
      return {
        ok: false,
        content: "",
        model: "",
        latencyMs,
        promptTokens: 0,
        completionTokens: 0,
        costYuan: 0,
        error: `HTTP ${response.status}: ${text.slice(0, 200)}`,
      };
    }

    const data = (await response.json()) as {
      model?: string;
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const content = data.choices?.[0]?.message?.content ?? "";
    const promptTokens = data.usage?.prompt_tokens ?? 0;
    const completionTokens = data.usage?.completion_tokens ?? 0;
    const costYuan =
      (promptTokens / 1_000_000) * INPUT_PRICE_PER_MILLION +
      (completionTokens / 1_000_000) * OUTPUT_PRICE_PER_MILLION;

    return {
      ok: true,
      content,
      model: data.model ?? "deepseek-chat",
      latencyMs,
      promptTokens,
      completionTokens,
      costYuan,
    };
  } catch (error) {
    return {
      ok: false,
      content: "",
      model: "",
      latencyMs: Date.now() - started,
      promptTokens: 0,
      completionTokens: 0,
      costYuan: 0,
      error: String(error),
    };
  }
}
