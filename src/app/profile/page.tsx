"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, findUser, loadSession } from "@/lib/auth";
import { addNotification } from "@/lib/notifications";
import { getTagDisplay } from "@/lib/categories";
import {
  loadApplications,
  loadApplicationsByApplicant,
  loadLocalPosts,
  loadPosts,
  loadProfile,
  loadPromotions,
  renewPost,
  saveProfile,
  updateApplicationStatus,
  updatePostContent,
} from "@/lib/store";
import { track } from "@/lib/analytics";
import { deadlineBadge, renewalState } from "@/lib/time";
import type { Application, Post, Profile } from "@/lib/types";
import type { Promotion } from "@/lib/types";

const emptyProfile: Profile = {
  name: "",
  major: "",
  grade: "",
  gender: "",
  age: "",
  mbti: "",
  schedule: "",
  teamStyle: "",
  mood: "😀",
  signature: "",
  skills: [],
};

const moodOptions = ["😀", "😌", "😴", "😭", "🔥", "🌧️", "🌈", "🐱"];
const scheduleOptions = ["早八型", "白天型", "夜猫子", "灵活"];
const teamStyleOptions = ["长期稳定", "短期搭伙", "任务导向", "随缘"];

interface CoachData {
  score: number;
  issues: string[];
  suggestions: string[];
  improvedTitle?: string;
  improvedDescription?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [skillsText, setSkillsText] = useState("");
  const [message, setMessage] = useState("");
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [now, setNow] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [coachTarget, setCoachTarget] = useState<string | null>(null);
  const [coachResult, setCoachResult] = useState<CoachData | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (session) {
      setIsAdmin(findUser(session.studentId)?.role === "admin");
      setMyApplications(loadApplicationsByApplicant(session.studentId));
    }
    const saved = loadProfile();
    if (saved) {
      setProfile(saved);
      setSkillsText((saved.skills ?? []).join("、"));
    }
    setMyPosts(loadLocalPosts());
    setApplications(loadApplications());
    setPromotions(loadPromotions());
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    saveProfile({
      ...profile,
      skills: skillsText
        .split(/[，,、\s]+/)
        .map((skill) => skill.trim())
        .filter(Boolean),
    });
    setMessage("资料已保存（保存在当前浏览器本地）。");
  }

  function handleRenew(post: Post) {
    const state = renewalState(post, now);
    if (!state.canRenew) {
      setMessage(state.reason);
      return;
    }
    const updated = renewPost(post.id, post.durationMinutes ?? 10080);
    if (!updated) {
      setMessage("续期失败：可能已达次数或时长上限，请重新发布。");
      return;
    }
    setMyPosts(loadLocalPosts());
    setMessage("续期成功，展示时间已顺延。");
  }

  /** 长期无人响应的帖子：让 AI 诊断问题并给可直接替换的改写 */
  async function requestPostCoach(post: Post) {
    setCoachTarget(post.id);
    setCoachResult(null);
    setCoachLoading(true);
    track("post_stale_alert", { postId: post.id });
    try {
      const response = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: post.title,
          description: post.description,
          skills: post.skills,
          grade: post.gradePreference ?? "",
          categoryLabel: getTagDisplay(post).label,
        }),
      });
      const data = await response.json();
      if (!data.fallback && data.coach) {
        setCoachResult(data.coach as CoachData);
        track("ai_coach", {
          source: "stale_post",
          score: data.coach.score,
          costYuan: data.metrics?.costYuan,
        });
      } else {
        setMessage(`AI 暂不可用（${data.error ?? "未知原因"}）。`);
        track("ai_fallback", { feature: "coach", reason: data.error ?? "unknown" });
      }
    } catch (error) {
      setMessage("网络异常，AI 改写没跑成。");
      track("ai_fallback", { feature: "coach", reason: String(error) });
    } finally {
      setCoachLoading(false);
    }
  }

  function applyPostCoach(postId: string) {
    if (!coachResult) {
      return;
    }
    const updated = updatePostContent(postId, {
      title: coachResult.improvedTitle,
      description: coachResult.improvedDescription,
    });
    if (updated) {
      setMyPosts(loadLocalPosts());
      setMessage("已采用 AI 改写版本，帖子内容已更新。");
      track("ai_coach_apply", { source: "stale_post", postId });
    } else {
      setMessage("改写没能保存，请重试。");
    }
    setCoachTarget(null);
    setCoachResult(null);
  }

  const myPostIds = new Set(myPosts.map((post) => post.id));
  const received = applications.filter((application) =>
    myPostIds.has(application.postId),
  );

  const displayName = (profile.name ?? "").trim() || "未命名同学";
  const avatarText = displayName.slice(0, 1);

  return (
    <main className="animate-fade-up mx-auto flex w-full max-w-2xl flex-col pt-6">
      <div className="glass rounded-3xl p-5 text-center shadow-lg shadow-[#5c6b62]/10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl font-bold text-white shadow-lg shadow-indigo-200">
          {avatarText}
        </div>
        <h1 className="mt-3 text-lg font-bold text-slate-900">{displayName}</h1>
        <p className="mt-1 text-xs text-[#7b8a80]">
          {[profile.major, profile.grade].filter(Boolean).join(" · ") ||
            "还没有填写专业和年级"}
        </p>
        <p className="mt-2 text-sm text-[#5c6b62]">
          {profile.signature || "写一句个性签名，让同学更容易认识你"}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
          {profile.mbti ? (
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-600">
              MBTI {profile.mbti}
            </span>
          ) : null}
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-600">
            心情 {profile.mood}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {isAdmin ? (
          <Link
            href="/admin"
            className="flex-1 rounded-2xl bg-amber-50 py-3 text-center text-sm font-medium text-amber-700"
          >
            🛠️ 进入管理端
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => {
            clearSession();
            router.replace("/login");
          }}
          className="flex-1 rounded-2xl bg-white py-3 text-center text-sm font-medium text-[#7b8a80] shadow-sm"
        >
          退出登录
        </button>
      </div>

      <Link
        href="/promote"
        className="card-soft card-hover mt-4 flex items-center justify-between rounded-3xl p-4"
      >
        <div>
          <p className="text-sm font-semibold text-slate-900">我的推广</p>
          <p className="mt-0.5 text-[11px] text-[#7b8a80]">
            把需求放到广场大屏，被更多同学看到
          </p>
        </div>
        <span className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-500 px-3.5 py-1.5 text-[11px] font-semibold text-white">
          上 C 位
        </span>
      </Link>

      <section className="card-soft mt-4 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">我的发布</h2>
          <span className="text-[11px] text-[#9aa7a0]">
            共 {myPosts.length} 条
          </span>
        </div>
        {myPosts.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-[#f7f8f4] p-4 text-center text-xs text-[#9aa7a0]">
            还没有发布过需求，去首页点"发布"试试。
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {myPosts.map((post) => {
              const tag = getTagDisplay(post);
              const badge = deadlineBadge(post.displayEndAt, now);
              const renew = renewalState(post, now);
              const applicationCount = applications.filter(
                (item) => item.postId === post.id,
              ).length;
              const hoursSinceCreated =
                (now - new Date(post.createdAt).getTime()) / 3_600_000;
              const stale =
                post.status === "open" &&
                hoursSinceCreated >= 48 &&
                applicationCount === 0;
              const moderationLabel =
                post.moderationStatus === "pending"
                  ? "审核中"
                  : post.moderationStatus === "rejected"
                    ? "已驳回"
                    : null;
              const toneClass =
                badge.tone === "expired"
                  ? "text-rose-500"
                  : badge.tone === "soon"
                    ? "text-amber-600"
                    : "text-[#7b8a80]";
              return (
                <div
                  key={post.id}
                  className="rounded-2xl border border-[#eef2ea] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${tag.badgeClass}`}
                    >
                      {tag.emoji} {tag.label}
                    </span>
                    <span className={`text-[11px] ${toneClass}`}>
                      {badge.text}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {post.title}
                  </p>
                  {moderationLabel ? (
                    <p
                      className={`mt-1 text-[11px] ${
                        post.moderationStatus === "rejected"
                          ? "text-rose-500"
                          : "text-amber-600"
                      }`}
                    >
                      {moderationLabel}
                      {post.moderationReasons?.length
                        ? `：${post.moderationReasons.join("；")}`
                        : ""}
                    </p>
                  ) : null}
                  {stale ? (
                    <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2.5">
                      <p className="text-[11px] leading-relaxed text-amber-700">
                        ⏰ 发布超过 48 小时还没人联系。多数情况不是没人想做，
                        而是这条写得让人不知道怎么回。
                      </p>
                      {coachTarget === post.id && coachResult ? (
                        <div className="mt-2 rounded-xl bg-white/85 p-2.5">
                          <p className="text-[11px] font-semibold text-amber-700">
                            质量分 {coachResult.score}/100
                          </p>
                          {coachResult.issues.length > 0 ? (
                            <ul className="mt-1 space-y-0.5 text-[11px] leading-relaxed text-[#5c6b62]">
                              {coachResult.issues.map((issue) => (
                                <li key={issue}>· {issue}</li>
                              ))}
                            </ul>
                          ) : null}
                          {coachResult.improvedTitle ? (
                            <p className="mt-2 text-[12px] font-medium text-slate-800">
                              {coachResult.improvedTitle}
                            </p>
                          ) : null}
                          {coachResult.improvedDescription ? (
                            <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-[#5c6b62]">
                              {coachResult.improvedDescription}
                            </p>
                          ) : null}
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => applyPostCoach(post.id)}
                              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white transition active:scale-95"
                            >
                              一键采用
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCoachTarget(null);
                                setCoachResult(null);
                              }}
                              className="rounded-lg border border-[#e3e9df] px-3 py-1.5 text-[11px] text-[#7b8a80] transition active:scale-95"
                            >
                              不用了
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={coachLoading && coachTarget === post.id}
                          onClick={() => requestPostCoach(post)}
                          className="mt-2 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-medium text-white transition active:scale-95 disabled:opacity-60"
                        >
                          {coachLoading && coachTarget === post.id
                            ? "AI 分析中…"
                            : "让 AI 帮我改写"}
                        </button>
                      )}
                    </div>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-[#9aa7a0]">
                      已续期 {post.renewCount ?? 0}/3 次
                    </span>
                    {renew.canRenew ? (
                      <button
                        type="button"
                        onClick={() => handleRenew(post)}
                        className="rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-medium text-indigo-600 transition active:scale-95"
                      >
                        续期
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#9aa7a0]">
                        {renew.reason}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card-soft mt-4 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">收到的沟通</h2>
          <span className="text-[11px] text-[#9aa7a0]">
            共 {received.length} 条
          </span>
        </div>
        {received.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-[#f7f8f4] p-4 text-center text-xs text-[#9aa7a0]">
            还没有人发起沟通。发布需求后，有人想聊就会出现在这里。
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {received.map((application) => (
              <div
                key={application.id}
                className="rounded-2xl border border-[#eef2ea] p-3"
              >
                <p className="text-sm font-medium text-slate-900">
                  {application.applicantName} ·{" "}
                  {application.applicantMajor || "未填写专业"} ·{" "}
                  {application.applicantGrade || "未填写年级"}
                </p>
                {application.applicantSkills &&
                application.applicantSkills.length > 0 ? (
                  <p className="mt-1 text-[11px] text-[#7b8a80]">
                    技能：{application.applicantSkills.join("、")}
                  </p>
                ) : null}
                <p className="mt-2 text-xs leading-relaxed text-[#5c6b62]">
                  {application.message}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-[#9aa7a0]">
                    {application.status === "pending"
                      ? "待处理"
                      : application.status === "accepted"
                        ? "已接受"
                        : "已婉拒"}
                  </span>
                  {application.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateApplicationStatus(
                            application.id,
                            "accepted",
                          );
                          if (application.applicantId) {
                            addNotification({
                              userId: application.applicantId,
                              type: "application_status",
                              title: "沟通申请已被接受",
                              content: `你发给《${
                                myPosts.find(
                                  (post) => post.id === application.postId,
                                )?.title ?? "需求"
                              }》的沟通申请已被接受。`,
                            });
                          }
                          setApplications(loadApplications());
                        }}
                        className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-600"
                      >
                        接受
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateApplicationStatus(
                            application.id,
                            "declined",
                          );
                          if (application.applicantId) {
                            addNotification({
                              userId: application.applicantId,
                              type: "application_status",
                              title: "沟通申请结果",
                              content: `你发给《${
                                myPosts.find(
                                  (post) => post.id === application.postId,
                                )?.title ?? "需求"
                              }》的沟通申请已被婉拒。`,
                            });
                          }
                          setApplications(loadApplications());
                        }}
                        className="rounded-full bg-[#f2f5ef] px-3 py-1.5 text-[11px] text-[#7b8a80]"
                      >
                        婉拒
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card-soft mt-4 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">我发出的申请</h2>
          <span className="text-[11px] text-[#9aa7a0]">
            共 {myApplications.length} 条
          </span>
        </div>
        {myApplications.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-[#f7f8f4] p-4 text-center text-xs text-[#9aa7a0]">
            还没有发出过沟通申请。
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {myApplications.map((application) => {
              const post = loadPosts().find(
                (item) => item.id === application.postId,
              );
              const statusText =
                application.status === "accepted"
                  ? "已接受"
                  : application.status === "declined"
                    ? "已婉拒"
                    : "待处理";
              const statusClass =
                application.status === "accepted"
                  ? "bg-emerald-50 text-emerald-600"
                  : application.status === "declined"
                    ? "bg-rose-50 text-rose-600"
                    : "bg-amber-50 text-amber-700";
              return (
                <div
                  key={application.id}
                  className="rounded-2xl border border-[#eef2ea] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {post?.title ?? "需求已下架"}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${statusClass}`}
                    >
                      {statusText}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#5c6b62]">
                    {application.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card-soft mt-4 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">我的推广</h2>
          <span className="text-[11px] text-[#9aa7a0]">
            共 {promotions.length} 条
          </span>
        </div>
        {promotions.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-[#f7f8f4] p-4 text-center text-xs text-[#9aa7a0]">
            还没有推广记录。可以在"我的推广"里把需求放到广场大屏。
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {promotions.map((promotion) => {
              const post = loadPosts().find(
                (item) => item.id === promotion.postId,
              );
              const expired = new Date(promotion.endAt).getTime() < now;
              const statusText =
                promotion.status === "pending_review"
                  ? "审核中"
                  : expired
                    ? "已结束"
                    : "展示中";
              const statusClass =
                promotion.status === "pending_review"
                  ? "bg-amber-50 text-amber-700"
                  : expired
                    ? "bg-[#f2f5ef] text-[#7b8a80]"
                    : "bg-emerald-50 text-emerald-600";
              return (
                <div
                  key={promotion.id}
                  className="rounded-2xl border border-[#eef2ea] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {post?.title ?? "需求已下架"}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${statusClass}`}
                    >
                      {statusText}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#7b8a80]">
                    {promotion.tier} · ¥{promotion.price} · 曝光{" "}
                    {promotion.impressions} · 点击 {promotion.clicks}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#9aa7a0]">
                    审核通过后开始统计真实的曝光与点击数据
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card-soft mt-4 space-y-4 rounded-3xl p-5">
        <label className="block">
          <span className="text-xs font-medium text-[#5c6b62]">昵称</span>
          <input
            value={profile.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="例如：小林"
            className="mt-1.5 w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </label>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="block">
            <span className="text-xs font-medium text-[#5c6b62]">专业</span>
            <input
              value={profile.major}
              onChange={(event) => update("major", event.target.value)}
              placeholder="例如：计算机"
              className="mt-1.5 w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[#5c6b62]">年级</span>
            <input
              value={profile.grade}
              onChange={(event) => update("grade", event.target.value)}
              placeholder="例如：大三"
              className="mt-1.5 w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[#5c6b62]">性别</span>
            <input
              value={profile.gender}
              onChange={(event) => update("gender", event.target.value)}
              placeholder="选填"
              className="mt-1.5 w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[#5c6b62]">年龄</span>
            <input
              value={profile.age}
              onChange={(event) => update("age", event.target.value)}
              placeholder="选填"
              className="mt-1.5 w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-[#5c6b62]">MBTI（选填）</span>
          <input
            value={profile.mbti}
            onChange={(event) => update("mbti", event.target.value)}
            placeholder="例如：INFP"
            className="mt-1.5 w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-[#5c6b62]">作息</span>
            <select
              value={profile.schedule ?? ""}
              onChange={(event) => update("schedule", event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">不填</option>
              {scheduleOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[#5c6b62]">组队偏好</span>
            <select
              value={profile.teamStyle ?? ""}
              onChange={(event) => update("teamStyle", event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
            >
              <option value="">不填</option>
              {teamStyleOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-[11px] leading-relaxed text-[#9aa7a0]">
          这两项是给 AI 匹配用的：技能都对但作息完全相反的人，AI 会主动帮你避开。
        </p>

        <div>
          <span className="text-xs font-medium text-[#5c6b62]">今天的心情</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {moodOptions.map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => update("mood", mood)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg transition duration-200 active:scale-90 ${
                  profile.mood === mood
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-[#e8ece5] bg-white"
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-[#5c6b62]">个性签名</span>
          <textarea
            value={profile.signature}
            onChange={(event) => update("signature", event.target.value)}
            rows={3}
            placeholder="写点让人记住你的话"
            className="mt-1.5 w-full resize-none rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-indigo-400"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-[#5c6b62]">
            技能或兴趣标签（用逗号分隔）
          </span>
          <input
            value={skillsText}
            onChange={(event) => setSkillsText(event.target.value)}
            placeholder="例如：Python、UI设计、摄影"
            className="mt-1.5 w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </label>

        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
        >
          保存资料
        </button>

        {message ? (
          <p className="rounded-xl bg-[#f2f5ef] px-3.5 py-2.5 text-xs text-[#5c6b62]">
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
