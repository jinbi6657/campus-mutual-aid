import type { Candidate } from "./ai-tasks";
import { getTagDisplay } from "./categories";
import {
  scoreQuestion,
  summarize,
  type EvalItemResult,
  type EvalReport,
} from "./eval-runner";
import { evalQuestions } from "./eval-set";
import { matchPosts } from "./match";
import { mockPosts } from "./mock-data";

export interface EvalProgress {
  done: number;
  total: number;
}

interface MatchApiResponse {
  fallback: boolean;
  recommendations?: { postId: string; reason: string; score: number }[];
  metrics?: { latencyMs: number; costYuan: number };
  candidateCount?: number;
  error?: string;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

/**
 * 在浏览器里跑评测：规则基线本地算，AI 匹配逐题调用 /api/ai/match。
 * 这样评测不再依赖长时间运行的服务端任务，静态托管 + 单个接口就能跑通。
 */
export async function runEvalInBrowser(
  limit = 50,
  options?: {
    onProgress?: (progress: EvalProgress) => void;
    signal?: AbortSignal;
  },
): Promise<EvalReport> {
  const count = Math.max(1, Math.min(limit, evalQuestions.length));
  const questions = evalQuestions.slice(0, count);
  const postsById = new Map(mockPosts.map((post) => [post.id, post]));
  const candidates: Candidate[] = mockPosts.map((post) => ({
    id: post.id,
    title: post.title,
    description: post.description,
    skills: post.skills,
    tagLabel: getTagDisplay(post).label,
    authorMajor: post.authorMajor,
    authorGrade: post.authorGrade,
  }));

  const baselineResults: EvalItemResult[] = questions.map((question) => {
    const started = Date.now();
    const matches = matchPosts(question.query, mockPosts);
    const ids = matches.map((match) => match.postId);
    const reasons = matches.map((match) => match.reason);
    const { score, suspected } = scoreQuestion(
      question,
      ids,
      reasons,
      postsById,
    );
    return {
      id: question.id,
      kind: question.kind,
      query: question.query,
      engine: "baseline" as const,
      count: ids.length,
      topIds: ids,
      score,
      suspectedHallucination: suspected,
      fallback: false,
      latencyMs: Date.now() - started,
      costYuan: 0,
      candidateCount: mockPosts.length,
    };
  });

  let completed = 0;

  const aiResults = await mapWithConcurrency(questions, 3, async (question) => {
    let payload: MatchApiResponse;
    try {
      const response = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question.query, candidates }),
        signal: options?.signal,
      });
      payload = (await response.json()) as MatchApiResponse;
    } catch (error) {
      payload = { fallback: true, error: String(error) };
    }

    const ids = payload.recommendations?.map((item) => item.postId) ?? [];
    const reasons = payload.recommendations?.map((item) => item.reason) ?? [];
    const { score, suspected } = scoreQuestion(
      question,
      ids,
      reasons,
      postsById,
    );

    completed += 1;
    options?.onProgress?.({ done: completed, total: questions.length });

    return {
      id: question.id,
      kind: question.kind,
      query: question.query,
      engine: "ai" as const,
      count: ids.length,
      topIds: ids,
      score,
      suspectedHallucination: suspected,
      fallback: payload.fallback,
      latencyMs: payload.metrics?.latencyMs ?? 0,
      costYuan: payload.metrics?.costYuan ?? 0,
      candidateCount: payload.candidateCount ?? candidates.length,
      error: payload.error,
    } satisfies EvalItemResult;
  });

  return {
    generatedAt: new Date().toISOString(),
    candidateCount: mockPosts.length,
    totalQuestions: questions.length,
    results: [...baselineResults, ...aiResults],
    summary: {
      baseline: summarize(baselineResults),
      ai: summarize(aiResults),
    },
  };
}
