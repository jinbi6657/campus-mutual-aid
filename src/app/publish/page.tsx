"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  getTag,
  getTagDisplay,
  getTagsByGroup,
  groups,
} from "@/lib/categories";
import { addPost } from "@/lib/store";
import { track } from "@/lib/analytics";
import { loadSession } from "@/lib/auth";
import { moderateContent } from "@/lib/moderation";

const durationPresets = [
  { id: "10m", label: "10 分钟", minutes: 10, hint: "演示 / 临时急事" },
  { id: "1h", label: "1 小时", minutes: 60, hint: "马上要办的事" },
  { id: "6h", label: "6 小时", minutes: 360, hint: "当天内解决" },
  { id: "24h", label: "24 小时", minutes: 1440, hint: "常用推荐" },
  { id: "3d", label: "3 天", minutes: 4320, hint: "常规组队" },
  { id: "7d", label: "7 天", minutes: 10080, hint: "比赛 / 长期搭子" },
  { id: "30d", label: "30 天", minutes: 43200, hint: "最长展示上限" },
];

interface CoachData {
  score: number;
  issues: string[];
  suggestions: string[];
  improvedTitle?: string;
  improvedDescription?: string;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getMonth() + 1}月${date.getDate()}日 ${hours}:${minutes}`;
}

export default function PublishPage() {
  const router = useRouter();
  const [groupId, setGroupId] = useState("study");
  const [tagId, setTagId] = useState("competition");
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState("");
  const [durationId, setDurationId] = useState("24h");
  const [customMinutes, setCustomMinutes] = useState("120");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [grade, setGrade] = useState("");
  const [message, setMessage] = useState("");
  const [published, setPublished] = useState<"approved" | "pending" | null>(
    null,
  );
  const [coach, setCoach] = useState<CoachData | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);

  function selectGroup(id: string) {
    setGroupId(id);
    setCustomMode(id === "custom");
    if (id === "custom") {
      setTagId("custom");
      return;
    }
    const first = getTagsByGroup(id)[0];
    setTagId(first ? first.id : "custom");
  }

  function selectTag(id: string) {
    setTagId(id);
    setCustomMode(id === "custom");
  }

  const durationMinutes = useMemo(() => {
    if (durationId === "custom") {
      const parsed = Number.parseInt(customMinutes, 10);
      if (Number.isNaN(parsed)) {
        return 60;
      }
      return Math.min(Math.max(parsed, 10), 43200);
    }
    return (
      durationPresets.find((preset) => preset.id === durationId)?.minutes ?? 1440
    );
  }, [durationId, customMinutes]);

  const endPreview = useMemo(
    () =>
      formatDateTime(
        new Date(Date.now() + durationMinutes * 60_000).toISOString(),
      ),
    [durationMinutes],
  );

  const display = getTagDisplay({
    type: customMode ? "custom" : tagId,
    customTag: customText,
  });

  async function generateDraft() {
    const skillList = skills.split(/[，,、\s]+/).filter(Boolean);
    const localDraft = `【${display.emoji} ${display.label}】${
      title || "新的校园需求"
    }\n\n${description || "在这里补充你的需求背景和目标"}\n\n需要这些能力：${
      skillList.length > 0 ? skillList.join("、") : "待补充"
    }\n期望对象：${grade || "不限"}\n\n感兴趣的同学欢迎联系，一起把事情做成。`;

    setMessage("正在生成文案…");
    try {
      const response = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          skills: skillList,
          grade,
          categoryLabel: display.label,
        }),
      });
      const data = await response.json();
      if (!data.fallback && data.draft) {
        setDescription(data.draft);
        setMessage(
          `已用 DeepSeek 生成文案（${data.metrics?.latencyMs ?? 0} ms，约 ¥${(
            data.metrics?.costYuan ?? 0
          ).toFixed(4)}）。`,
        );
        track("ai_call", {
          feature: "draft",
          fallback: false,
          latencyMs: data.metrics?.latencyMs,
          costYuan: data.metrics?.costYuan,
        });
        return;
      }
      setDescription(localDraft);
      setMessage(
        `AI 暂不可用（${data.error ?? "未知原因"}），已使用规则版文案草稿。`,
      );
      track("ai_fallback", { feature: "draft", reason: data.error ?? "unknown" });
    } catch (error) {
      setDescription(localDraft);
      setMessage("网络异常，已使用规则版文案草稿。");
      track("ai_fallback", { feature: "draft", reason: String(error) });
    }
  }

  /** 需求质量体检：诊断这条需求为什么可能没人回应，并给出可直接替换的改写 */
  async function runCoach() {
    if (!title.trim() && !description.trim()) {
      setMessage("先写点标题或描述，AI 才有东西可看。");
      return;
    }
    const skillList = skills.split(/[，,、\s]+/).filter(Boolean);
    setCoachLoading(true);
    setMessage("AI 正在检查这条需求…");
    try {
      const response = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          skills: skillList,
          grade,
          categoryLabel: display.label,
        }),
      });
      const data = await response.json();
      if (!data.fallback && data.coach) {
        setCoach(data.coach as CoachData);
        setMessage(
          `AI 体检完成：质量分 ${data.coach.score}/100（${
            data.metrics?.latencyMs ?? 0
          } ms，约 ¥${(data.metrics?.costYuan ?? 0).toFixed(4)}）。`,
        );
        track("ai_coach", {
          score: data.coach.score,
          latencyMs: data.metrics?.latencyMs,
          costYuan: data.metrics?.costYuan,
        });
        return;
      }
      setMessage(`AI 暂不可用（${data.error ?? "未知原因"}），可以先按自己的写法发布。`);
      track("ai_fallback", { feature: "coach", reason: data.error ?? "unknown" });
    } catch (error) {
      setMessage("网络异常，AI 体检没跑成。");
      track("ai_fallback", { feature: "coach", reason: String(error) });
    } finally {
      setCoachLoading(false);
    }
  }

  function applyCoach() {
    if (!coach) {
      return;
    }
    if (coach.improvedTitle) {
      setTitle(coach.improvedTitle);
    }
    if (coach.improvedDescription) {
      setDescription(coach.improvedDescription);
    }
    track("ai_coach_apply", { score: coach.score });
    setMessage("已采用 AI 改写版本，你可以继续修改后发布。");
    setCoach(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (customMode && !customText.trim()) {
      setMessage("请填写自定义标签内容，最多 8 个字。");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setMessage("请先填写标题和需求描述。");
      return;
    }

    const now = Date.now();
    const moderation = moderateContent(
      `${title} ${description} ${skills}`,
    );
    const session = loadSession();
    addPost({
      id: `local-${now}`,
      type: customMode ? "custom" : tagId,
      customTag: customMode ? customText.trim().slice(0, 8) : undefined,
      title: title.trim(),
      description: description.trim(),
      skills: skills
        .split(/[，,、\s]+/)
        .map((skill) => skill.trim())
        .filter(Boolean),
      gradePreference: grade,
      authorName: "我",
      authorMajor: "本校",
      authorGrade: grade || "不限",
      createdAt: "刚刚",
      status: "open",
      displayStartAt: new Date(now).toISOString(),
      displayEndAt: new Date(now + durationMinutes * 60_000).toISOString(),
      durationMinutes,
      ownerId: session?.studentId,
      moderationStatus: moderation.status,
      moderationReasons: moderation.reasons,
    });
    track("post_create", { tagId: customMode ? "custom" : tagId });

    if (moderation.status === "pending") {
      setMessage(
        `已提交审核：${moderation.reasons.join(
          "；",
        )}。审核通过后其他同学才能看到，可在"我的发布"里查看状态。`,
      );
      setPublished("pending");
      return;
    }

    setMessage("发布成功！");
    setPublished("approved");
  }

  return (
    <main className="animate-fade-up mx-auto flex w-full max-w-3xl flex-col pt-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">发布需求</h1>
        <p className="mt-1 text-xs text-[#7b8a80]">
          先选大类和小标签，再设置展示时长，到期后可以手动续期。
        </p>
      </div>

      <div className="card-soft mt-5 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-[#5c6b62]">
            第 1 步 · 选择大类
          </p>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${display.badgeClass}`}
          >
            {display.emoji} {display.label}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {groups.map((group) => {
            const active = group.id === groupId;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => selectGroup(group.id)}
                className={`rounded-2xl border p-3 text-left transition duration-200 active:scale-[0.98] ${
                  active
                    ? "border-indigo-500 bg-indigo-50/70 shadow-sm"
                    : "border-transparent bg-white/70 hover:border-[#e3e9df]"
                }`}
              >
                <span className="text-lg">{group.emoji}</span>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {group.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[#8a978f]">
                  {group.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card-soft mt-4 rounded-3xl p-5">
        <p className="text-xs font-medium text-[#5c6b62]">
          第 2 步 · 选择具体标签
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {getTagsByGroup(groupId).map((tag) => {
            const active = !customMode && tag.id === tagId;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => selectTag(tag.id)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition duration-200 active:scale-95 ${
                  active
                    ? "border-indigo-500 bg-indigo-50 font-medium text-indigo-700"
                    : "border-[#e8ece5] bg-white/80 text-[#5c6b62] hover:border-[#d7dfd2]"
                }`}
              >
                <span className="mr-1">{tag.emoji}</span>
                {tag.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => selectTag("custom")}
            className={`rounded-xl border px-3 py-2.5 text-left text-sm transition duration-200 active:scale-95 ${
              customMode
                ? "border-indigo-500 bg-indigo-50 font-medium text-indigo-700"
                : "border-[#e8ece5] bg-white/80 text-[#5c6b62] hover:border-[#d7dfd2]"
            }`}
          >
            ✏️ 自定义
          </button>
        </div>

        {customMode ? (
          <div className="mt-3">
            <input
              value={customText}
              onChange={(event) => setCustomText(event.target.value.slice(0, 8))}
              placeholder="输入自定义标签，最多 8 个字"
              className="w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
            <p className="mt-1 text-[11px] text-[#9aa7a0]">
              {customText.length}/8 · 自定义标签需要审核后才会公开展示
            </p>
          </div>
        ) : null}
      </div>

      <div className="card-soft mt-4 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-[#5c6b62]">
            第 3 步 · 设置展示时长（必选）
          </p>
          <span className="text-[11px] text-indigo-600">
            展示至 {endPreview}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {durationPresets.map((preset) => {
            const active = durationId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDurationId(preset.id)}
                className={`rounded-xl border px-3 py-2.5 text-left transition duration-200 active:scale-95 ${
                  active
                    ? "border-indigo-500 bg-indigo-50/70"
                    : "border-[#e8ece5] bg-white/80 hover:border-[#d7dfd2]"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    active ? "text-indigo-700" : "text-[#5c6b62]"
                  }`}
                >
                  {preset.label}
                </p>
                <p className="mt-0.5 text-[11px] text-[#9aa7a0]">
                  {preset.hint}
                </p>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setDurationId("custom")}
            className={`rounded-xl border px-3 py-2.5 text-left transition duration-200 active:scale-95 ${
              durationId === "custom"
                ? "border-indigo-500 bg-indigo-50/70"
                : "border-[#e8ece5] bg-white/80 hover:border-[#d7dfd2]"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                durationId === "custom" ? "text-indigo-700" : "text-[#5c6b62]"
              }`}
            >
              自定义
            </p>
            <p className="mt-0.5 text-[11px] text-[#9aa7a0]">10 分钟 ~ 30 天</p>
          </button>
        </div>

        {durationId === "custom" ? (
          <div className="mt-3 flex items-center gap-2">
            <input
              value={customMinutes}
              onChange={(event) =>
                setCustomMinutes(event.target.value.replace(/[^\d]/g, ""))
              }
              className="w-28 rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
            <span className="text-xs text-[#7b8a80]">
              分钟（最少 10 分钟，最多 43200 分钟）
            </span>
          </div>
        ) : null}

        <p className="mt-2 text-[11px] text-[#9aa7a0]">
          到期后会自动下架，需要到"我的发布"里手动续期；找到人也可以提前关闭。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="card-soft space-y-4 rounded-3xl p-5">
          <label className="block">
            <span className="text-xs font-medium text-[#5c6b62]">标题</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：大创项目找一名会 UI 设计的队友"
              className="mt-1.5 w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none placeholder:text-[#9aa7a0] focus:border-indigo-400"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-[#5c6b62]">需求描述</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              placeholder="描述背景、需要对方做什么、时间和合作方式"
              className="mt-1.5 w-full resize-none rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm leading-relaxed outline-none placeholder:text-[#9aa7a0] focus:border-indigo-400"
            />
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={generateDraft}
              className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50/80 py-2.5 text-sm font-medium text-indigo-600 transition duration-200 hover:bg-indigo-100 active:scale-[0.98]"
            >
              ✨ 一键生成招募文案草稿
            </button>
            <button
              type="button"
              onClick={runCoach}
              disabled={coachLoading}
              className="flex-1 rounded-xl border border-[#e3e9df] bg-white/80 py-2.5 text-sm font-medium text-[#5c6b62] transition duration-200 hover:bg-white active:scale-[0.98] disabled:opacity-60"
            >
              {coachLoading ? "AI 体检中…" : "🔍 让 AI 检查这条需求"}
            </button>
          </div>
        </div>

        {coach ? (
          <div className="card-soft mt-4 rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                🔍 AI 需求体检
              </h2>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  coach.score >= 80
                    ? "bg-emerald-50 text-emerald-600"
                    : coach.score >= 60
                      ? "bg-amber-50 text-amber-700"
                      : "bg-rose-50 text-rose-600"
                }`}
              >
                质量分 {coach.score}
              </span>
            </div>

            {coach.issues.length > 0 ? (
              <div className="mt-3">
                <p className="text-[11px] font-medium text-[#7b8a80]">
                  可能没人回的原因
                </p>
                <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-[#5c6b62]">
                  {coach.issues.map((issue) => (
                    <li key={issue}>· {issue}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {coach.suggestions.length > 0 ? (
              <div className="mt-3">
                <p className="text-[11px] font-medium text-[#7b8a80]">
                  AI 建议
                </p>
                <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-[#5c6b62]">
                  {coach.suggestions.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {coach.improvedTitle || coach.improvedDescription ? (
              <div className="mt-3 rounded-2xl bg-[#f7f8f4] p-3.5">
                <p className="text-[11px] font-medium text-[#7b8a80]">
                  AI 改写版本
                </p>
                {coach.improvedTitle ? (
                  <p className="mt-1.5 text-[13px] font-medium text-slate-800">
                    {coach.improvedTitle}
                  </p>
                ) : null}
                {coach.improvedDescription ? (
                  <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-[#5c6b62]">
                    {coach.improvedDescription}
                  </p>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={applyCoach}
                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition active:scale-95"
                  >
                    一键采用改写
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoach(null)}
                    className="rounded-xl border border-[#e3e9df] px-4 py-2.5 text-xs text-[#7b8a80] transition active:scale-95"
                  >
                    不用了
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="card-soft space-y-4 rounded-3xl p-5">
          <label className="block">
            <span className="text-xs font-medium text-[#5c6b62]">
              需要的技能或关键词（用逗号分隔）
            </span>
            <input
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
              placeholder="例如：UI设计, Figma, 移动端"
              className="mt-1.5 w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none placeholder:text-[#9aa7a0] focus:border-indigo-400"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-[#5c6b62]">
              期望年级（选填）
            </span>
            <input
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
              placeholder="例如：大二/大三，或填不限"
              className="mt-1.5 w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none placeholder:text-[#9aa7a0] focus:border-indigo-400"
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
        >
          发布需求
        </button>

        {message ? (
          <p className="rounded-xl bg-[#f2f5ef] px-3.5 py-2.5 text-xs text-[#5c6b62]">
            {message}
          </p>
        ) : null}
      </form>

      {published ? (
        <div className="card-soft mt-4 rounded-3xl p-5">
          <p className="text-sm font-semibold text-slate-900">
            {published === "approved" ? "🎉 发布成功" : "⏳ 已提交审核"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#5c6b62]">
            {published === "approved"
              ? "你的需求已经公开，可以在「我的发布」里查看和管理。"
              : "审核通过后其他同学才能看到，可以在「我的发布」里查看状态和原因。"}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 py-2.5 text-xs font-semibold text-white"
            >
              查看我的发布
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex-1 rounded-xl bg-[#f2f5ef] py-2.5 text-xs text-[#5c6b62]"
            >
              回到首页
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
