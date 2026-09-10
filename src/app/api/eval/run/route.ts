import { NextResponse } from "next/server";
import { runEval } from "@/lib/eval-runner";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const limit = Number(body.limit ?? 50);
  const report = await runEval(Number.isNaN(limit) ? 50 : limit);
  return NextResponse.json(report);
}
