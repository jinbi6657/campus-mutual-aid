"use client";

import { useState } from "react";
import { runEvalInBrowser } from "@/lib/eval-client";
import type { EvalReport } from "@/lib/eval-runner";

const kindLabel: Record<string, string> = {
  normal: "常规需求",
  vague: "模糊需求",
  none: "无合适人选",
};

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function EvalPage() {
  const [report, setReport] = useState<EvalReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );

  async function run(limit: number) {
    setLoading(true);
    setReport(null);
    setProgress({ done: 0, total: Math.min(limit, 50) });
    setMessage(
      `正在跑 ${limit} 题对比：规则基线本地计算，AI 部分逐题调用接口，大约需要 1–2 分钟。`,
    );
    try {
      const data = await runEvalInBrowser(limit, {
        onProgress: ({ done, total }) => setProgress({ done, total }),
      });
      setReport(data);
      setMessage(`完成：共 ${data.totalQuestions} 题。`);
    } catch (error) {
      setMessage(`运行失败：${String(error)}`);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  function exportJson() {
    if (!report) {
      return;
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ai-eval-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyMarkdown() {
    if (!report) {
      return;
    }
    const { baseline, ai } = report.summary;
    const text = `# AI 匹配评测报告\n\n生成时间：${new Date(
      report.generatedAt,
    ).toLocaleString("zh-CN")}\n题目数：${report.totalQuestions}\n候选数：${
      report.candidateCount
    }\n\n| 指标 | 规则基线 | AI 匹配 |\n|---|---|---|\n| 平均分 | ${baseline.avgScore.toFixed(
      2,
    )} | ${ai.avgScore.toFixed(2)} |\n| 命中率 | ${percent(
      baseline.hitRate,
    )} | ${percent(ai.hitRate)} |\n| 幻觉率 | ${percent(
      baseline.hallucinationRate,
    )} | ${percent(ai.hallucinationRate)} |\n| 兜底/失败率 | ${percent(
      baseline.fallbackRate,
    )} | ${percent(ai.fallbackRate)} |\n| 平均延迟 | ${Math.round(
      baseline.avgLatencyMs,
    )} ms | ${Math.round(ai.avgLatencyMs)} ms |\n| 平均成本 | ¥${baseline.avgCostYuan.toFixed(
      5,
    )} | ¥${ai.avgCostYuan.toFixed(5)} |\n`;
    await navigator.clipboard.writeText(text);
    setMessage("已复制 Markdown 报告到剪贴板。");
  }

  return (
    <main className="animate-fade-up mx-auto flex w-full max-w-4xl flex-col pt-6">
      <div className="glass rounded-3xl p-5 shadow-lg shadow-[#5c6b62]/10">
        <h1 className="text-xl font-bold text-slate-900">🧪 AI 评测中心</h1>
        <p className="mt-1 text-xs leading-relaxed text-[#7b8a80]">
          用 50 题测试集对比「规则匹配基线」和「AI 匹配（DeepSeek）」，输出命中率、幻觉率、兜底率、延迟和成本。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => run(10)}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-medium text-white transition active:scale-95 disabled:opacity-50"
          >
            快速跑 10 题
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => run(50)}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition active:scale-95 disabled:opacity-50"
          >
            完整跑 50 题
          </button>
          {report ? (
            <>
              <button
                type="button"
                onClick={exportJson}
                className="rounded-xl bg-[#f2f5ef] px-4 py-2.5 text-xs text-[#5c6b62]"
              >
                导出 JSON
              </button>
              <button
                type="button"
                onClick={copyMarkdown}
                className="rounded-xl bg-[#f2f5ef] px-4 py-2.5 text-xs text-[#5c6b62]"
              >
                复制报告
              </button>
            </>
          ) : null}
        </div>
        {message ? (
          <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-xs text-[#5c6b62]">
            {message}
          </p>
        ) : null}
        {loading && progress ? (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-[#7b8a80]">
              <span>AI 匹配进度</span>
              <span>
                {progress.done} / {progress.total}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#eef2ea]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-300"
                style={{
                  width: `${
                    progress.total === 0
                      ? 0
                      : Math.round((progress.done / progress.total) * 100)
                  }%`,
                }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {report ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {[
              { label: "规则 · 平均分", value: report.summary.baseline.avgScore.toFixed(2) },
              { label: "AI · 平均分", value: report.summary.ai.avgScore.toFixed(2) },
              { label: "规则 · 命中率", value: percent(report.summary.baseline.hitRate) },
              { label: "AI · 命中率", value: percent(report.summary.ai.hitRate) },
              { label: "AI · 幻觉率", value: percent(report.summary.ai.hallucinationRate) },
              { label: "AI · 平均成本", value: `¥${report.summary.ai.avgCostYuan.toFixed(4)}` },
              {
                label: "AI · 平均候选数",
                value: report.summary.ai.avgCandidateCount.toFixed(1),
              },
            ].map((card) => (
              <div key={card.label} className="card-soft rounded-3xl p-4">
                <p className="text-[11px] text-[#7b8a80]">{card.label}</p>
                <p className="mt-1.5 text-xl font-bold text-slate-900">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <section className="card-soft mt-4 overflow-x-auto rounded-3xl p-5">
            <h2 className="text-sm font-semibold text-slate-900">对比总表</h2>
            <table className="mt-3 w-full min-w-[520px] text-left text-xs">
              <thead className="text-[#9aa7a0]">
                <tr>
                  <th className="pb-2">指标</th>
                  <th className="pb-2">规则基线</th>
                  <th className="pb-2">AI 匹配</th>
                  <th className="pb-2">变化</th>
                </tr>
              </thead>
              <tbody className="text-[#5c6b62]">
                {[
                  {
                    label: "平均分（满分 4）",
                    baseline: report.summary.baseline.avgScore.toFixed(2),
                    ai: report.summary.ai.avgScore.toFixed(2),
                  },
                  {
                    label: "命中率（≥3 分）",
                    baseline: percent(report.summary.baseline.hitRate),
                    ai: percent(report.summary.ai.hitRate),
                  },
                  {
                    label: "幻觉率",
                    baseline: percent(report.summary.baseline.hallucinationRate),
                    ai: percent(report.summary.ai.hallucinationRate),
                  },
                  {
                    label: "兜底/失败率",
                    baseline: percent(report.summary.baseline.fallbackRate),
                    ai: percent(report.summary.ai.fallbackRate),
                  },
                  {
                    label: "平均延迟",
                    baseline: `${Math.round(report.summary.baseline.avgLatencyMs)} ms`,
                    ai: `${Math.round(report.summary.ai.avgLatencyMs)} ms`,
                  },
                  {
                    label: "平均成本",
                    baseline: "¥0",
                    ai: `¥${report.summary.ai.avgCostYuan.toFixed(5)}`,
                  },
                ].map((row) => (
                  <tr key={row.label} className="border-t border-[#eef2ea]">
                    <td className="py-2">{row.label}</td>
                    <td className="py-2">{row.baseline}</td>
                    <td className="py-2 font-medium text-slate-900">
                      {row.ai}
                    </td>
                    <td className="py-2 text-[#9aa7a0]">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card-soft mt-4 rounded-3xl p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              逐题明细
            </h2>
            <div className="mt-3 space-y-2">
              {Array.from(
                new Set(report.results.map((item) => item.id)),
              ).map((id) => {
                const baseline = report.results.find(
                  (item) => item.id === id && item.engine === "baseline",
                );
                const ai = report.results.find(
                  (item) => item.id === id && item.engine === "ai",
                );
                if (!baseline || !ai) {
                  return null;
                }
                return (
                  <div
                    key={id}
                    className="rounded-2xl bg-[#f7f8f4] px-3 py-2.5 text-[11px] text-[#5c6b62]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-900">
                        {id} · {kindLabel[baseline.kind]}
                      </span>
                      <span>
                        规则 {baseline.score} 分 ｜ AI {ai.score} 分
                        {ai.fallback ? "（回退）" : ""}
                      </span>
                    </div>
                    <p className="mt-1">{baseline.query}</p>
                    <p className="mt-1 text-[#9aa7a0]">
                      规则推荐：{baseline.topIds.join("、") || "无"} ｜ AI 推荐：
                      {ai.topIds.join("、") || "无"}
                      {ai.error ? ` ｜ 错误：${ai.error}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
