import { NextResponse } from "next/server";
import { runAiCoach, type AiDraftInput } from "@/lib/ai-tasks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as AiDraftInput;
  const result = await runAiCoach(body);

  if (result.fallback) {
    return NextResponse.json({ fallback: true, error: result.error });
  }
  return NextResponse.json({
    fallback: false,
    coach: result.coach,
    metrics: result.metrics,
  });
}
