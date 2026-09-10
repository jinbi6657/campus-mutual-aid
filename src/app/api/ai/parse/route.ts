import { NextResponse } from "next/server";
import { runAiParse } from "@/lib/ai-tasks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { text?: string };
  const text = (body.text ?? "").trim();

  if (!text) {
    return NextResponse.json({ fallback: true, error: "缺少文本" });
  }

  const result = await runAiParse(text);
  if (result.fallback) {
    return NextResponse.json({ fallback: true, error: result.error });
  }
  return NextResponse.json({
    fallback: false,
    data: result.data,
    metrics: result.metrics,
  });
}
