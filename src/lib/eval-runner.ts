import { runAiMatch, type Candidate } from "./ai-tasks";
import { getTagDisplay } from "./categories";
import { evalQuestions, type EvalKind, type EvalQuestion } from "./eval-set";
import { matchPosts } from "./match";
import { mockPosts } from "./mock-data";

export type Engine = "baseline" | "ai";

export interface EvalItemResult {
  id: string;
  kind: EvalKind;
  query: string;
  engine: Engine;
  count: number;
  topIds: string[];
  score: number;
  suspectedHallucination: boolean;
  fallback: boolean;
  latencyMs: number;
  costYuan: number;
  candidateCount: number;
  error?: string;
}

export interface EngineSummary {
  total: number;
  avgScore: number;
  hitRate: number;
  hallucinationRate: number;
  fallbackRate: number;
  avgLatencyMs: number;
  avgCostYuan: number;
  avgCandidateCount: number;
}

export interface EvalReport {
  generatedAt: string;
  candidateCount: number;
  totalQuestions: number;
  results: EvalItemResult[];
  summary: Record<Engine, EngineSummary>;
}

const HALLUCINATION_MARKERS = [
  "获奖",
  "奖项",
  "国奖",
  "一等奖",
  "二等奖",
  "三等奖",
  "奖学金",
  "发表论文",
  "专利",
];

function isHardMatch(
  question: EvalQuestion,
  post: (typeof mockPosts)[number] | undefined,
): boolean {
  if (!post) {
    return false;
  }
  if (question.expectedIds?.includes(post.id)) {
    return true;
  }
  const text = `${post.title} ${post.description} ${post.skills.join(" ")}`;
  if (question.expectedSkills?.some((skill) => text.includes(skill))) {
    return true;
  }
  if (question.expectedTags?.includes(post.type)) {
    return true;
  }
  return false;
}

export function scoreQuestion(
  question: EvalQuestion,
  ids: string[],
  reasons: string[],
  postsById: Map<string, (typeof mockPosts)[number]>,
): { score: number; suspected: boolean } {
  if (question.kind === "none") {
    const passed = ids.length === 0;
    return { score: passed ? 4 : 1, suspected: !passed };
  }

  if (question.kind === "vague") {
    if (ids.length === 0) {
      return { score: 2, suspected: false };
    }
    return { score: 4, suspected: false };
  }

  if (ids.length === 0) {
    return { score: 1, suspected: false };
  }

  const top = postsById.get(ids[0]);
  const fabricated = reasons.some((reason) =>
    HALLUCINATION_MARKERS.some((marker) => reason.includes(marker)),
  );

  if (isHardMatch(question, top)) {
    return { score: 4, suspected: false };
  }

  const anyHard = ids
    .slice(0, 3)
    .some((id) => isHardMatch(question, postsById.get(id)));

  if (anyHard) {
    return { score: 3, suspected: false };
  }

  return { score: fabricated ? 1 : 2, suspected: fabricated };
}

export function summarize(items: EvalItemResult[]): EngineSummary {
  const total = items.length || 1;
  return {
    total: items.length,
    avgScore: items.reduce((sum, item) => sum + item.score, 0) / total,
    hitRate: items.filter((item) => item.score >= 3).length / total,
    hallucinationRate:
      items.filter((item) => item.suspectedHallucination).length / total,
    fallbackRate: items.filter((item) => item.fallback).length / total,
    avgLatencyMs:
      items.reduce((sum, item) => sum + item.latencyMs, 0) / total,
    avgCostYuan: items.reduce((sum, item) => sum + item.costYuan, 0) / total,
    avgCandidateCount:
      items.reduce((sum, item) => sum + item.candidateCount, 0) / total,
  };
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

export async function runEval(limit = 50): Promise<EvalReport> {
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

  const aiResults = await mapWithConcurrency(questions, 3, async (question) => {
    const result = await runAiMatch(question.query, candidates);
    const ids = result.recommendations?.map((item) => item.postId) ?? [];
    const reasons = result.recommendations?.map((item) => item.reason) ?? [];
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
      engine: "ai" as const,
      count: ids.length,
      topIds: ids,
      score,
      suspectedHallucination: suspected,
      fallback: result.fallback,
      latencyMs: result.metrics?.latencyMs ?? 0,
      costYuan: result.metrics?.costYuan ?? 0,
      candidateCount: result.candidateCount ?? candidates.length,
      error: result.error,
    };
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
