"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CommunicationSheet } from "@/components/CommunicationSheet";
import { getTagDisplay } from "@/lib/categories";
import { addReport, loadPosts } from "@/lib/store";
import { track } from "@/lib/analytics";
import { findUser, loadSession } from "@/lib/auth";
import { formatDeadline } from "@/lib/time";
import type { Post } from "@/lib/types";

const reportReasons = [
  "虚假信息 / 诈骗",
  "色情低俗",
  "广告骚扰",
  "人身攻击",
  "其他不当内容",
];

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [post, setPost] = useState<Post | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [commOpen, setCommOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }
    const found = loadPosts().find((item) => item.id === id) ?? null;
    setPost(found);
    setLoaded(true);
  }, [id]);

  function handleReport(reason: string) {
    if (!id) {
      return;
    }
    const session = loadSession();
    const user = session ? findUser(session.studentId) : null;
    addReport(id, reason, {
      id: session?.studentId,
      name: user?.name,
    });
    track("report_submit", { source: "mutual", reason });
    setReported(true);
    setReportOpen(false);
  }

  if (!loaded) {
    return (
      <main className="mx-auto w-full max-w-3xl pt-10">
        <div className="card-soft h-40 animate-pulse rounded-3xl" />
      </main>
    );
  }

  if (!post) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col items-center pt-16 text-center">
        <p className="text-3xl">🔍</p>
        <h1 className="mt-3 text-lg font-bold text-slate-900">
          没有找到这条需求
        </h1>
        <p className="mt-2 text-sm text-[#7b8a80]">
          它可能已经到期下架，或者被发布人关闭了。
        </p>
        <Link
          href="/"
          className="mt-5 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white"
        >
          回到首页
        </Link>
      </main>
    );
  }

  const tag = getTagDisplay(post);

  return (
    <main className="animate-fade-up mx-auto flex w-full max-w-3xl flex-col pt-6">
      <Link
        href="/"
        className="mb-4 w-fit rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-medium text-[#5c6b62] shadow-sm transition active:scale-95"
      >
        ← 返回首页
      </Link>

      <article className="card-soft rounded-3xl p-6">
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${tag.badgeClass}`}
        >
          {tag.emoji} {tag.label}
        </span>
        <h1 className="mt-3 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
          {post.title}
        </h1>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#5c6b62]">
          {post.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-[#f2f5ef] px-2 py-1 text-[11px] text-[#5c6b62]"
            >
              {skill}
            </span>
          ))}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-xs text-[#7b8a80]">
          <div>
            <dt className="text-[#9aa7a0]">发布人</dt>
            <dd className="mt-1 text-[#5c6b62]">
              {post.authorName} · {post.authorMajor} · {post.authorGrade}
            </dd>
          </div>
          <div>
            <dt className="text-[#9aa7a0]">截止时间</dt>
            <dd className="mt-1 text-[#5c6b62]">
              {formatDeadline(post.displayEndAt)}
            </dd>
          </div>
        </dl>

        {reported ? (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-600">
            举报已提交，我们会尽快处理。
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setCommOpen(true)}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition active:scale-[0.98]"
          >
            立即沟通
          </button>
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="flex-1 rounded-xl border border-[#e3e9df] py-3 text-sm font-medium text-[#5c6b62] transition hover:bg-white active:scale-[0.98]"
          >
            举报这条内容
          </button>
        </div>
      </article>

      {commOpen ? (
        <CommunicationSheet post={post} onClose={() => setCommOpen(false)} />
      ) : null}

      {reportOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-6 sm:items-center">
          <div
            className="absolute inset-0 bg-[#1f2933]/40 backdrop-blur-sm"
            onClick={() => setReportOpen(false)}
          />
          <div className="modal-pop relative w-full max-w-md rounded-3xl bg-[#fffdfa] p-5 shadow-2xl">
            <h2 className="text-sm font-semibold text-slate-900">举报原因</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {reportReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => handleReport(reason)}
                  className="rounded-full bg-[#f2f5ef] px-3 py-1.5 text-xs text-[#5c6b62] transition hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setReportOpen(false)}
              className="mt-4 w-full rounded-xl border border-[#e3e9df] py-2.5 text-sm text-[#7b8a80]"
            >
              取消
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
