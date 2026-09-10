import { getGroup, getTag } from "./categories";
import type { MatchResult, Post } from "./types";

function bigrams(input: string): string[] {
  const clean = input.replace(/[^\p{L}\p{N}]+/gu, "");
  const result = new Set<string>();
  for (let index = 0; index < clean.length - 1; index += 1) {
    result.add(clean.slice(index, index + 2));
  }
  return Array.from(result);
}

/**
 * 规则匹配基线：不调用大模型，用标签、同义词与关键词命中做排序。
 * 它将作为评测报告里的对照组，和后续接入的 AI 匹配做对比。
 */
export function matchPosts(input: string, posts: Post[]): MatchResult[] {
  const text = input.trim().toLowerCase();
  const inputBigrams = bigrams(text);

  const results = posts.map((post) => {
    const tag = getTag(post.type);
    const group = getGroup(tag.groupId);
    const haystack = [
      tag.label,
      group.label,
      ...tag.synonyms,
      post.customTag ?? "",
      post.title,
      post.description,
      post.majorPreference ?? "",
      post.gradePreference ?? "",
      ...post.skills,
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    const hits: string[] = [];

    for (const skill of post.skills) {
      if (text.includes(skill.toLowerCase())) {
        score += 5;
        hits.push(skill);
      }
    }

    for (const keyword of [tag.label, ...tag.synonyms]) {
      if (keyword && text.includes(keyword.toLowerCase())) {
        score += 4;
        hits.push(keyword);
      }
    }

    for (const token of inputBigrams) {
      if (haystack.includes(token)) {
        score += 1;
      }
    }

    if (post.status === "open") {
      score += 1;
    }

    const uniqueHits = Array.from(new Set(hits));
    const reason =
      uniqueHits.length > 0
        ? `命中标签或技能：${uniqueHits.join("、")}`
        : "需求描述有一定相似度，建议进一步沟通确认";

    return {
      postId: post.id,
      name: post.authorName,
      major: post.authorMajor,
      grade: post.authorGrade,
      category: post.type,
      reason,
      source: uniqueHits,
      score,
    } satisfies MatchResult;
  });

  return results
    .filter((result) => result.score > 1)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
}
