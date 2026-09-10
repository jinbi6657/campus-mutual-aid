"use client";

import { useEffect, useState } from "react";
import { getTagDisplay } from "@/lib/categories";
import { deadlineBadge } from "@/lib/time";
import type { Post } from "@/lib/types";

const statusLabel: Record<Post["status"], string> = {
  open: "招募中",
  matched: "已组队",
  closed: "已关闭",
};

const toneClass: Record<string, string> = {
  normal: "text-[#7b8a80]",
  soon: "text-amber-600",
  expired: "text-rose-500",
};

export function PostCard({
  post,
  onClick,
  promotionLabel,
}: {
  post: Post;
  onClick?: (post: Post, rect: DOMRect) => void;
  promotionLabel?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const tag = getTagDisplay(post);
  const badge = now === null ? null : deadlineBadge(post.displayEndAt, now);

  return (
    <button
      type="button"
      onClick={(event) =>
        onClick?.(post, event.currentTarget.getBoundingClientRect())
      }
      className="w-full text-left"
    >
      <article
        className={`card-hover rounded-3xl border border-white/60 bg-[#fffdfa]/75 p-5 shadow-[0_8px_30px_rgba(31,41,51,0.10)] backdrop-blur-md ${
          promotionLabel ? "ring-1 ring-amber-200/80" : ""
        }`}
      >
        {promotionLabel ? (
          <span className="mb-2 inline-block rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
            {promotionLabel}
          </span>
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${tag.badgeClass}`}
          >
            {tag.emoji} {tag.label}
          </span>
          <span className="pt-1 text-[11px] text-[#9aa7a0]">
            {post.createdAt}
          </span>
        </div>

        <h2 className="mt-3 text-[15px] font-semibold leading-snug text-slate-900">
          {post.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#5c6b62]">
          {post.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-[#f2f5ef] px-2 py-1 text-[11px] text-[#5c6b62]"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#eef2ea] pt-2.5 text-[11px]">
          <span className="text-[#7b8a80]">
            {tag.group.emoji} {tag.group.label} · {post.authorMajor} ·{" "}
            {post.authorGrade}
          </span>
          <span className="flex items-center gap-2">
            {badge ? (
              <span className={toneClass[badge.tone]}>{badge.text}</span>
            ) : null}
            <span className="text-[#7b8a80]">{statusLabel[post.status]}</span>
          </span>
        </div>
      </article>
    </button>
  );
}
