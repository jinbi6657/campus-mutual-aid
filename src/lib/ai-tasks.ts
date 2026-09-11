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
  /** 软性画像：作息、性格、组队偏好，用于"技能之外"的匹配 */
  authorMbti?: string;
  authorSchedule?: string;
  authorStyle?: string;
  authorBio?: string;
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
  /** 三段式解释：共同点 / 互补点 / 怎么开口 */
  common?: string;
  complement?: string;
  opener?: string;
}

export interface AiClarifyQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface AiCoachResult {
  score: number;
  issues: string[];
  suggestions: string[];
  improvedTitle?: string;
  improvedDescription?: string;
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
          '你是校园互助平台的智能匹配助手。只输出 JSON：{"recommendations":[{"postId":"候选id","reason":"一句话概括为什么合适","common":"你和对方的共同点","complement":"你们的互补点或对方能补上你缺的什么","opener":"建议第一句怎么开口，一句话，具体可照抄","score":0-100}]}。最多 3 条，按匹配度从高到低。\n匹配时先看技能、标签、场景是否对得上；如果候选里带有作息、性格（MBTI）、组队偏好，也要纳入判断——技能都对但作息完全相反、组队心态不同，属于减分项，但不要仅凭性格就否定技能匹配。\n只能基于给定候选推荐，绝对不能编造候选、经历、奖项、联系方式；如果确实没有合适的，recommendations 返回空数组。',
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

/**
 * 追问：判断需求信息是否足够。不够就给 2 个可直接点选的问题，避免"信息不足时只能返回空"。
 */
export async function runAiClarify(text: string): Promise<{
  fallback: boolean;
  needClarify?: boolean;
  reason?: string;
  questions?: AiClarifyQuestion[];
  metrics?: AiMetrics;
  error?: string;
}> {
  const result = await callDeepSeek(
    [
      {
        role: "system",
        content:
          '你是校园互助平台的需求澄清助手。判断用户这句话是否具体到"可以直接拿去匹配人"。只输出 JSON：{"needClarify":true或false,"reason":"一句话说明为什么","questions":[{"id":"q1","question":"问题","options":["选项1","选项2","选项3"]}]}。\n判断标准：至少要能看出"要找什么类型的人或事"。如果连方向都没有（例如"有人能帮我个忙吗""想找人一起玩"），就 needClarify=true。\n需要澄清时最多问 2 个问题，每个问题给 3-4 个具体、互斥、可直接点选的选项，最后一个选项固定是"其他（我自己补充）"。不要问用户已经说过的信息。\n信息已经足够时 needClarify=false，questions 返回空数组。',
      },
      { role: "user", content: text },
    ],
    { json: true, temperature: 0.2, maxTokens: 500 },
  );

  if (!result.ok) {
    return { fallback: true, error: result.error };
  }

  try {
    const data = JSON.parse(result.content) as {
      needClarify?: boolean;
      reason?: string;
      questions?: AiClarifyQuestion[];
    };
    const questions = (data.questions ?? [])
      .filter((item) => item && item.question)
      .slice(0, 2);
    if (!data.needClarify || questions.length === 0) {
      return { fallback: false, needClarify: false, questions: [], metrics: toMetrics(result) };
    }
    return {
      fallback: false,
      needClarify: true,
      reason: data.reason,
      questions,
      metrics: toMetrics(result),
    };
  } catch {
    return { fallback: true, error: "模型输出不是合法 JSON" };
  }
}

/**
 * 帖子质量教练：发布前或长期无人响应时，诊断这条需求为什么招不到人，并给可直接替换的改写。
 */
export async function runAiCoach(input: AiDraftInput): Promise<{
  fallback: boolean;
  coach?: AiCoachResult;
  metrics?: AiMetrics;
  error?: string;
}> {
  const result = await callDeepSeek(
    [
      {
        role: "system",
        content:
          '你是校园互助平台的需求质量教练。用户写下一条招募需求，你要诊断它为什么可能没人回应，并给出可直接替换的改写。只输出 JSON：{"score":0-100,"issues":["问题1","问题2"],"suggestions":["建议1","建议2"],"improvedTitle":"改写后的标题","improvedDescription":"改写后的正文"}。\n诊断角度：要找的人是否说清楚了、需求边界是否明确（做什么、要多久、什么时间）、有没有说明对方能得到什么、语气是否让人愿意回、有没有漏掉关键信息（技能/时间/地点/是否付费）。\n改写要求：120 字以内；只能用用户已经给出的信息，严禁编造专业、时间、报酬、联系方式；不确定的信息用「可商量」「时间另约」这类留白表达，不要凭空补具体数字。注意：改写是给发布人参考的，不要写成广告腔。',
      },
      {
        role: "user",
        content: `类别：${input.categoryLabel ?? ""}\n标题：${input.title ?? ""}\n描述：${input.description ?? ""}\n技能：${(input.skills ?? []).join("、")}\n期望年级：${input.grade ?? "不限"}`,
      },
    ],
    { json: true, temperature: 0.4, maxTokens: 700 },
  );

  if (!result.ok) {
    return { fallback: true, error: result.error };
  }

  try {
    const coach = JSON.parse(result.content) as AiCoachResult;
    return {
      fallback: false,
      coach: {
        score: Math.max(0, Math.min(100, Number(coach.score) || 0)),
        issues: (coach.issues ?? []).slice(0, 4),
        suggestions: (coach.suggestions ?? []).slice(0, 4),
        improvedTitle: coach.improvedTitle,
        improvedDescription: coach.improvedDescription,
      },
      metrics: toMetrics(result),
    };
  } catch {
    return { fallback: true, error: "模型输出不是合法 JSON" };
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
