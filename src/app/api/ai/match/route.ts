import { NextResponse } from "next/server";
import { runAiMatch, type Candidate } from "@/lib/ai-tasks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    query?: string;
    candidates?: Candidate[];
  };
  const query = (body.query ?? "").trim();
  const candidates = (body.candidates ?? []).slice(0, 200);

  if (!query || candidates.length === 0) {
    return NextResponse.json({ fallback: true, error: "缺少查询或候选" });
  }

  const result = await runAiMatch(query, candidates);
  if (result.fallback) {
    return NextResponse.json({ fallback: true, error: result.error });
  }
  return NextResponse.json({
    fallback: false,
    recommendations: result.recommendations,
    metrics: result.metrics,
    candidateCount: result.candidateCount,
    totalCandidates: result.totalCandidates,
  });
}
