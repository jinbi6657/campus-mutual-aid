import { callDeepSeek, type AiCallResult } from "./ai";

export interface AiMetrics {
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  costYuan: number;
}

export interface Candidate {
  id: string;
  title: string;
  description: string;
  skills: string[];
  tagLabel?: string;
  authorMajor?: string;
  authorGrade?: string;
}

export interface AiParseData {
  skills: string[];
  major: string;
  grade: string;
  timeNote: string;
  summary: string;
}

export interface AiMatchRecommendation {
  postId: string;
  reason: string;
  score: number;
}

export interface AiDraftInput {
  title?: string;
  description?: string;
  skills?: string[];
  grade?: string;
  categoryLabel?: string;
}

function bigrams(input: string): string[] {
  const clean = input.replace(/[^\p{L}\p{N}]+/gu, "");
  const result = new Set<string>();
  for (let index = 0; index < clean.length - 1; index += 1) {
    result.add(clean.slice(index, index + 2));
  }
  return Array.from(result);
}

/**
 * 规则粗筛：先用便宜的关键词/技能匹配打分，取前 limit 条再交给大模型精排。
 * 目的：降低 prompt token（成本）、减少噪声、提升响应速度。
 */
export function prefilterCandidates(
  query: string,
  candidates: Candidate[],
  limit = 12,
): Candidate[] {
  const text = query.toLowerCase();
  const tokens = bigrams(text);

  const scored = candidates.map((candidate, index) => {
    const haystack = `${candidate.title} ${candidate.description} ${candidate.skills.join(
      " ",
    )} ${candidate.tagLabel ?? ""}`.toLowerCase();
    let score = 0;

    for (const skill of candidate.skills) {
      if (text.includes(skill.toLowerCase())) {
        score += 6;
      }
    }
    if (candidate.tagLabel && text.includes(candidate.tagLabel.toLowerCase())) {
      score += 4;
    }
    for (const token of tokens) {
      if (haystack.includes(token)) {
        score += 1;
      }
    }
    return { candidate, score, index };
  });

  scored.sort((left, right) => right.score - left.score || left.index - right.index);
  const top = scored.slice(0, limit).map((entry) => entry.candidate);

  // 不足 limit 时按原顺序补齐，保证候选数量稳定
  if (top.length < limit) {
    for (const entry of scored) {
      if (top.length >= limit) {
        break;
      }
      if (!top.includes(entry.candidate)) {
        top.push(entry.candidate);
      }
    }
  }

  return top;
}

function toMetrics(result: AiCallResult): AiMetrics {
  return {
    latencyMs: result.latencyMs,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    costYuan: result.costYuan,
  };
}

export async function runAiParse(text: string): Promise<{
  fallback: boolean;
  data?: AiParseData;
  metrics?: AiMetrics;
  error?: string;
}> {
  const result = await callDeepSeek(
    [
      {
        role: "system",
        content:
          "你是校园互助平台的需求解析助手。只输出 JSON，不要任何多余文字。JSON 字段：skills（字符串数组）、major（字符串）、grade（字符串）、timeNote（字符串）、summary（一句话概括）。无法判断的字段用空字符串或空数组。",
      },
      { role: "user", content: text },
    ],
    { json: true, temperature: 0.2, maxTokens: 400 },
  );

  if (!result.ok) {
    return { fallback: true, error: result.error };
  }

  try {
    const data = JSON.parse(result.content) as AiParseData;
    return { fallback: false, data, metrics: toMetrics(result) };
  } catch {
    return { fallback: true, error: "模型输出不是合法 JSON" };
  }
}

export async function runAiMatch(
  query: string,
  candidates: Candidate[],
  options?: { candidateLimit?: number },
): Promise<{
  fallback: boolean;
  recommendations?: AiMatchRecommendation[];
  metrics?: AiMetrics;
  candidateCount?: number;
  totalCandidates?: number;
  error?: string;
}> {
  const totalCandidates = candidates.length;
  const filtered = prefilterCandidates(
    query,
    candidates,
    options?.candidateLimit ?? 12,
  );

  const result = await callDeepSeek(
    [
      {
        role: "system",
        content:
          '你是校园互助平台的智能匹配助手。只输出 JSON：{"recommendations":[{"postId":"候选id","reason":"一句话具体理由","score":0-100}]}。最多 3 条，按匹配度从高到低。只能基于给定候选推荐，绝对不能编造候选、经历或奖项；如果没有合适的，recommendations 返回空数组。',
      },
      {
        role: "user",
        content: `用户需求：${query}\n\n候选列表（JSON）：${JSON.stringify(
          filtered,
        )}`,
      },
    ],
    { json: true, temperature: 0.2, maxTokens: 800 },
  );

  if (!result.ok) {
    return {
      fallback: true,
      error: result.error,
      candidateCount: filtered.length,
      totalCandidates,
    };
  }

  try {
    const data = JSON.parse(result.content) as {
      recommendations?: AiMatchRecommendation[];
    };
    const recommendations = (data.recommendations ?? []).filter((item) =>
      filtered.some((candidate) => candidate.id === item.postId),
    );
    return {
      fallback: false,
      recommendations,
      metrics: toMetrics(result),
      candidateCount: filtered.length,
      totalCandidates,
    };
  } catch {
    return {
      fallback: true,
      error: "模型输出不是合法 JSON",
      candidateCount: filtered.length,
      totalCandidates,
    };
  }
}

export async function runAiDraft(input: AiDraftInput): Promise<{
  fallback: boolean;
  draft?: string;
  metrics?: AiMetrics;
  error?: string;
}> {
  const result = await callDeepSeek(
    [
      {
        role: "system",
        content:
          "你是校园互助平台的招募文案助手。请写一段 120 字以内的招募文案，语气真诚、具体、不夸张，包含：要做什么、需要什么样的同学。不要编造任何信息；不要编造联系方式（禁止出现微信号、手机号、QQ、邮箱等）；结尾用一句「感兴趣的同学欢迎联系」即可。不要用营销腔。只输出文案正文。",
      },
      {
        role: "user",
        content: `类别：${input.categoryLabel ?? ""}\n标题：${
          input.title ?? ""
        }\n描述：${input.description ?? ""}\n技能：${(
          input.skills ?? []
        ).join("、")}\n期望年级：${input.grade ?? "不限"}`,
      },
    ],
    { temperature: 0.6, maxTokens: 400 },
  );

  if (!result.ok) {
    return { fallback: true, error: result.error };
  }
  return { fallback: false, draft: result.content.trim(), metrics: toMetrics(result) };
}
