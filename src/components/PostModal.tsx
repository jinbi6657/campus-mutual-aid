"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getTagDisplay } from "@/lib/categories";
import type { PromotionTier } from "@/lib/promotions";
import { addReport } from "@/lib/store";
import { track } from "@/lib/analytics";
import { findUser, loadSession } from "@/lib/auth";
import { formatDeadline, formatRemaining } from "@/lib/time";
import type { Post } from "@/lib/types";
import { CommunicationSheet } from "./CommunicationSheet";

const reportReasons = [
  "虚假信息 / 诈骗",
  "色情低俗",
  "广告骚扰",
  "人身攻击",
  "其他不当内容",
];

export function PostModal({
  post,
  originRect,
  tier,
  premiumEndAt,
  onClose,
}: {
  post: Post;
  originRect: DOMRect | null;
  tier?: PromotionTier;
  premiumEndAt?: string;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const scrollAnchorRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({
    opacity: 0,
  });
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [commOpen, setCommOpen] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    // 方案 B：浮层打开期间不再锁定页面滚动，网页竖向滚动条保持可见、可用。
    // 记录打开瞬间的滚动位置，关闭时用它把卡片飞回"卡片现在所在的位置"。
    scrollAnchorRef.current = window.scrollY;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    const element = cardRef.current;
    if (!element || !originRect) {
      setEntered(true);
      return;
    }

    const target = element.getBoundingClientRect();
    const dx = originRect.left - target.left;
    const dy = originRect.top - target.top;
    const scaleX = originRect.width / target.width;
    const scaleY = originRect.height / target.height;

    setCardStyle({
      transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
      transformOrigin: "top left",
      opacity: 0.3,
      transition: "none",
    });

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCardStyle({
          transform: "translate(0, 0) scale(1, 1)",
          transformOrigin: "top left",
          opacity: 1,
          transition:
            "transform 380ms cubic-bezier(0.22,1,0.36,1), opacity 320ms ease",
        });
        setEntered(true);
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [originRect, mounted]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        requestClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function requestClose() {
    const element = cardRef.current;
    if (element && originRect) {
      const target = element.getBoundingClientRect();
      // 背景可滚，originRect 是打开时的视口坐标，需要按滚动位移换算到当前位置。
      const scrolledBy = window.scrollY - scrollAnchorRef.current;
      const dx = originRect.left - target.left;
      const dy = originRect.top - scrolledBy - target.top;
      const scaleX = originRect.width / target.width;
      const scaleY = originRect.height / target.height;
      setClosing(true);
      setCardStyle({
        transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
        transformOrigin: "top left",
        opacity: 0.15,
        transition:
          "transform 340ms cubic-bezier(0.4,0,0.2,1), opacity 300ms ease",
      });
      window.setTimeout(onClose, 340);
      return;
    }
    onClose();
  }

  function handleReport(reason: string) {
    const session = loadSession();
    const user = session ? findUser(session.studentId) : null;
    addReport(post.id, reason, {
      id: session?.studentId,
      name: user?.name,
    });
    track("report_submit", { source: "mutual", reason });
    setReported(true);
    setReportOpen(false);
  }

  const tag = getTagDisplay(post);
  const promotionLabel =
    tier === "category_top"
      ? "📌 分类置顶 · 推广"
      : tier === "main"
        ? "👑 主屏 C 位 · 推广"
        : "👑 搭子头条 · 轮播推广";

  if (!mounted) {
    return null;
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div
          className="fixed inset-0 bg-[#1f2933]/45"
          style={{
            opacity: closing || !entered ? 0 : 1,
            backdropFilter: closing || !entered ? "blur(0px)" : "blur(8px)",
            WebkitBackdropFilter:
              closing || !entered ? "blur(0px)" : "blur(8px)",
            transition:
              "opacity 320ms ease, backdrop-filter 320ms ease, -webkit-backdrop-filter 320ms ease",
          }}
          onClick={requestClose}
        />

        <div
          ref={cardRef}
          style={cardStyle}
          className={`relative max-h-[82vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 shadow-2xl ${
            tier
              ? tier === "category_top"
                ? "bg-gradient-to-b from-[#fffdf6] to-[#fffdfa] ring-2 ring-amber-200"
                : "bg-gradient-to-b from-[#fffaf0] to-[#fffdfa] ring-2 ring-amber-300/80"
              : "bg-[#fffdfa]"
          }`}
        >
          {tier && tier !== "category_top" ? (
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-200/50 blur-2xl" />
          ) : null}

          <div className="relative flex items-center justify-between">
            <button
              type="button"
              onClick={requestClose}
              className="rounded-full bg-[#f2f5ef] px-3.5 py-1.5 text-xs font-medium text-[#5c6b62] transition active:scale-95"
            >
              ← 返回
            </button>
            <button
              type="button"
              onClick={() => setReportOpen((value) => !value)}
              className="rounded-full px-3 py-1.5 text-xs text-[#9aa7a0] transition hover:bg-[#f2f5ef] active:scale-95"
            >
              举报
            </button>
          </div>

          {tier ? (
            <div className="relative mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm ${
                  tier === "category_top"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                }`}
              >
                {promotionLabel}
              </span>
              {premiumEndAt && now !== null ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                  {formatRemaining(premiumEndAt, now)}
                </span>
              ) : null}
            </div>
          ) : (
            <span
              className={`relative mt-4 inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${tag.badgeClass}`}
            >
              {tag.emoji} {tag.label}
            </span>
          )}

          <h2 className="relative mt-3 text-xl font-bold leading-snug text-slate-900">
            {post.title}
          </h2>
          <p className="relative mt-3 text-sm leading-relaxed text-[#5c6b62]">
            {post.description}
          </p>

          <div className="relative mt-4 flex flex-wrap gap-1.5">
            {post.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-[#f2f5ef] px-2 py-1 text-[11px] text-[#5c6b62]"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="relative mt-4 space-y-1 text-xs text-[#7b8a80]">
            <p>
              发布人：{post.authorName} · {post.authorMajor} ·{" "}
              {post.authorGrade}
            </p>
            <p>{formatDeadline(post.displayEndAt)}</p>
          </div>

          {reportOpen ? (
            <div className="relative mt-4 rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
              <p className="text-xs font-medium text-rose-600">
                选择举报原因
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {reportReasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => handleReport(reason)}
                    className="rounded-full bg-white px-3 py-1.5 text-[11px] text-rose-600 shadow-sm transition active:scale-95"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {reported ? (
            <p className="relative mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-600">
              举报已提交，我们会尽快处理。
            </p>
          ) : null}

          <div className="relative mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setCommOpen(true)}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold text-white shadow-md transition active:scale-[0.98] ${
                tier
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-200"
                  : "bg-gradient-to-r from-indigo-600 to-fuchsia-500 shadow-indigo-200"
              }`}
            >
              立即沟通
            </button>
            <Link
              href={`/post/${post.id}`}
              className="flex-1 rounded-xl border border-[#e3e9df] py-3 text-center text-sm font-medium text-[#5c6b62] transition hover:bg-white active:scale-[0.98]"
            >
              查看详情 →
            </Link>
          </div>
        </div>
      </div>

      {commOpen ? (
        <CommunicationSheet post={post} onClose={() => setCommOpen(false)} />
      ) : null}
    </>,
    document.body,
  );
}
