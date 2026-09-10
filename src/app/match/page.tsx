"use client";

import { useState } from "react";
import { PostCard } from "@/components/PostCard";
import { PostModal } from "@/components/PostModal";
import { track } from "@/lib/analytics";
import { getTagDisplay } from "@/lib/categories";
import { matchPosts } from "@/lib/match";
import { loadPosts } from "@/lib/store";
import type { MatchResult, Post } from "@/lib/types";

const examples = [
  "找会 Python、能一起做大创或数模的队友",
  "找每周三晚上一起打羽毛球的球友",
  "找人帮忙剪一支 3 分钟的视频",
];

interface AiMetrics {
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  costYuan: number;
}

export default function MatchPage() {
  const [engine, setEngine] = useState<"ai" | "baseline">("ai");
  const [input, setInput] = useState("");
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [parsed, setParsed] = useState<Record<string, unknown> | null>(null);
  const [metrics, setMetrics] = useState<AiMetrics | null>(null);
  const [candidateInfo, setCandidateInfo] = useState<{
    total: number;
    filtered: number;
  } | null>(null);
  const [note, setNote] = useState("");
  const [engineUsed, setEngineUsed] = useState<"ai" | "baseline" | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<{
    post: Post;
    rect: DOMRect;
  } | null>(null);

  async function handleMatch() {
    const query = input.trim();
    if (!query) {
      return;
    }
    setLoading(true);
    setNote("");
    setParsed(null);
    setMetrics(null);
    setCandidateInfo(null);

    const posts = loadPosts();

    if (engine === "baseline") {
      const local = matchPosts(query, posts);
      setResults(local);
      setEngineUsed("baseline");
      track("ai_call", { engine: "baseline", resultCount: local.length });
      setLoading(false);
      return;
    }

    try {
      const parseResponse = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query }),
      });
      const parseData = await parseResponse.json();
      if (!parseData.fallback) {
        setParsed(parseData.data as Record<string, unknown>);
      }
    } catch {
      // 解析失败不影响匹配
    }

    const candidates = posts.map((post) => ({
      id: post.id,
      title: post.title,
      description: post.description,
      skills: post.skills,
      tagLabel: getTagDisplay(post).label,
      authorMajor: post.authorMajor,
      authorGrade: post.authorGrade,
    }));

    try {
      const response = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, candidates }),
      });
      const data = await response.json();

      if (data.fallback || !Array.isArray(data.recommendations)) {
        const local = matchPosts(query, posts);
        setResults(local);
        setEngineUsed("baseline");
        setNote(
          `AI 暂不可用（${data.error ?? "未知原因"}），已自动切换规则匹配基线。`,
        );
        track("ai_fallback", { reason: data.error ?? "unknown" });
        track("ai_call", {
          engine: "ai",
          fallback: true,
          resultCount: local.length,
        });
      } else {
        const mapped: MatchResult[] = (
          data.recommendations as {
            postId: string;
            reason: string;
            score: number;
          }[]
        ).map((item) => {
          const post = posts.find((entry) => entry.id === item.postId);
          return {
            postId: item.postId,
            name: post?.authorName ?? "同学",
            major: post?.authorMajor ?? "",
            grade: post?.authorGrade ?? "",
            category: post?.type ?? "custom",
            reason: item.reason,
            source: (post?.skills ?? []).slice(0, 3),
            score: item.score ?? 0,
          };
        });
        setResults(mapped);
        setEngineUsed("ai");
        setMetrics(data.metrics ?? null);
        if (data.candidateCount && data.totalCandidates) {
          setCandidateInfo({
            total: data.totalCandidates,
            filtered: data.candidateCount,
          });
        }
        track("ai_call", {
          engine: "ai",
          fallback: false,
          resultCount: mapped.length,
          latencyMs: data.metrics?.latencyMs,
          costYuan: data.metrics?.costYuan,
        });
      }
    } catch (error) {
      const local = matchPosts(query, posts);
      setResults(local);
      setEngineUsed("baseline");
      setNote("网络异常，已自动切换规则匹配基线。");
      track("ai_fallback", { reason: String(error) });
    }

    setLoading(false);
  }

  const allPosts = results ? loadPosts() : [];

  return (
    <main className="animate-fade-up mx-auto flex w-full max-w-4xl flex-col pt-5 md:pt-8">
      <section className="glass rounded-3xl p-5 shadow-lg shadow-[#5c6b62]/10 sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-indigo-500">
            AI MATCH
          </span>
          <span className="rounded-full bg-[#fffdfa]/80 px-2.5 py-1 text-[11px] text-[#7b8a80]">
            DeepSeek + 规则粗筛
          </span>
        </div>
        <h1 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">
          AI 智能匹配
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5c6b62]">
          一句话描述你要找的人或事，AI 会从全站发布里帮你挑出最合适的几个。
        </p>
      </section>

      <section className="glass mt-4 rounded-3xl p-5 shadow-lg shadow-[#5c6b62]/10 sm:p-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEngine("ai")}
            className={`flex-1 rounded-full px-3.5 py-2 text-xs font-medium transition duration-200 active:scale-95 ${
              engine === "ai"
                ? "bg-slate-900 text-white"
                : "bg-[#fffdfa] text-[#5c6b62] shadow-sm"
            }`}
          >
            AI 匹配（DeepSeek）
          </button>
          <button
            type="button"
            onClick={() => setEngine("baseline")}
            className={`flex-1 rounded-full px-3.5 py-2 text-xs font-medium transition duration-200 active:scale-95 ${
              engine === "baseline"
                ? "bg-slate-900 text-white"
                : "bg-[#fffdfa] text-[#5c6b62] shadow-sm"
            }`}
          >
            规则匹配（基线）
          </button>
        </div>

        <p className="mt-4 text-sm font-medium text-slate-800">你想找什么？</p>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={5}
          placeholder="例如：想找一名会 UI 设计、能一起做大创的同学"
          className="mt-3 w-full resize-none rounded-2xl border border-white/70 bg-[#fffdfa]/90 px-4 py-3.5 text-[15px] leading-relaxed outline-none placeholder:text-[#9aa7a0] focus:border-indigo-400"
        />

        <div className="mt-3">
          <p className="text-[11px] text-[#9aa7a0]">试试这样问：</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setInput(example)}
                className="rounded-full bg-[#fffdfa] px-3 py-1.5 text-xs text-[#5c6b62] shadow-sm transition duration-200 hover:bg-white active:scale-95"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleMatch}
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 py-3 text-[15px] font-semibold text-white shadow-md shadow-indigo-200 transition duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "匹配中…" : "开始匹配"}
        </button>

        {parsed ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              ...((parsed.skills as string[]) ?? []).map(
                (skill) => `技能：${skill}`,
              ),
              parsed.major ? `专业：${parsed.major}` : "",
              parsed.grade ? `年级：${parsed.grade}` : "",
              parsed.timeNote ? `时间：${parsed.timeNote}` : "",
            ]
              .filter(Boolean)
              .map((label) => (
                <span
                  key={String(label)}
                  className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] text-indigo-600"
                >
                  {label}
                </span>
              ))}
          </div>
        ) : null}

        {note ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
            {note}
          </p>
        ) : null}

        {metrics ? (
          <p className="mt-2 text-[11px] text-[#9aa7a0]">
            本次 AI 调用：{metrics.latencyMs} ms · 约 ¥
            {metrics.costYuan.toFixed(4)} ·{" "}
            {metrics.promptTokens + metrics.completionTokens} tokens
            {candidateInfo
              ? ` · 候选粗筛 ${candidateInfo.total} → ${candidateInfo.filtered}`
              : ""}
          </p>
        ) : null}
      </section>

      {results ? (
        <section className="mt-5">
          <div
            className={`mb-3 rounded-2xl px-4 py-3 text-xs ${
              engineUsed === "ai"
                ? "bg-indigo-50 text-indigo-600"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            本次结果由
            {engineUsed === "ai"
              ? " AI 匹配（DeepSeek）生成"
              : " 规则匹配基线生成"}
            {engineUsed === "baseline" && note ? ` · ${note}` : ""}
          </div>
          <h2 className="text-sm font-semibold text-slate-700">
            为你匹配到 {results.length} 个可能合适的人
          </h2>
          {results.length === 0 ? (
            <div className="glass mt-3 rounded-3xl p-6 text-center text-sm text-[#7b8a80]">
              暂时没有特别匹配的，换个说法或放宽条件再试试。
            </div>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((result) => {
                const post = allPosts.find(
                  (entry) => entry.id === result.postId,
                );
                return (
                  <div key={result.postId} className="space-y-2">
                    {post ? (
                      <PostCard
                        post={post}
                        onClick={(item, rect) =>
                          setSelected({ post: item, rect })
                        }
                      />
                    ) : (
                      <div className="glass rounded-3xl p-5 text-sm text-[#7b8a80]">
                        这条需求已经下架
                      </div>
                    )}
                    <div className="rounded-2xl border border-white/60 bg-[#fffdfa]/75 p-3 shadow-[0_8px_30px_rgba(31,41,51,0.08)] backdrop-blur-md">
                      <div className="flex items-center justify-between text-[11px] text-[#9aa7a0]">
                        <span>匹配分 {result.score}</span>
                        <span>
                          {engine === "ai" ? "AI 匹配" : "规则匹配"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-[#5c6b62]">
                        {result.reason}
                      </p>
                      {result.source.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {result.source.map((item) => (
                            <span
                              key={item}
                              className="rounded-md bg-[#f2f5ef] px-2 py-1 text-[11px] text-[#7b8a80]"
                            >
                              依据：{item}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {selected ? (
        <PostModal
          post={selected.post}
          originRect={selected.rect}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </main>
  );
}
