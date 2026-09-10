"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getGroup, getTag } from "@/lib/categories";
import { featuredItems } from "@/lib/featured";
import { formatRemaining } from "@/lib/time";
import type { FeaturedItem } from "@/lib/featured";
import { track } from "@/lib/analytics";

const DURATION = 5000;
const COUNT = featuredItems.length;

function CountdownRing({ progress }: { progress: number }) {
  const radius = 11;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      className="text-indigo-500"
      aria-hidden="true"
    >
      <circle
        cx="14"
        cy="14"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="2.5"
      />
      <circle
        cx="14"
        cy="14"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress / 100)}
        transform="rotate(-90 14 14)"
      />
    </svg>
  );
}

export function FeaturedCarousel({
  onOpen,
}: {
  onOpen?: (item: FeaturedItem, rect: DOMRect) => void;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [instant, setInstant] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  const progressRef = useRef(0);
  const offsetRef = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const activePointer = useRef<number | null>(null);
  const moved = useRef(false);
  const captured = useRef(false);

  useEffect(() => {
    if (paused) {
      return;
    }

    let raf = 0;
    let last = performance.now();

    const tick = (current: number) => {
      const delta = current - last;
      last = current;
      progressRef.current += (delta / DURATION) * 100;

      if (progressRef.current >= 100) {
        progressRef.current = 0;
        if (index >= COUNT - 1) {
          setInstant(true);
          setIndex(0);
        } else {
          setIndex(index + 1);
        }
      }

      setProgress(progressRef.current);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, index]);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const item = featuredItems[index];
    if (item) {
      track("promotion_impression", {
        itemId: item.id,
        postId: item.postId,
      });
    }
  }, [index]);

  useEffect(() => {
    if (!instant) {
      return;
    }
    const raf = requestAnimationFrame(() => setInstant(false));
    return () => cancelAnimationFrame(raf);
  }, [instant]);

  function go(step: number) {
    const next = Math.min(Math.max(index + step, 0), COUNT - 1);
    if (next === index) {
      return;
    }
    progressRef.current = 0;
    setProgress(0);
    setIndex(next);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("a,[data-no-drag]")) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    activePointer.current = event.pointerId;
    moved.current = false;
    captured.current = false;
    startX.current = event.clientX;
    startY.current = event.clientY;
    offsetRef.current = 0;
    setOffset(0);
    setDragging(true);
    setPaused(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (activePointer.current !== event.pointerId) {
      return;
    }

    const dx = event.clientX - startX.current;
    const dy = event.clientY - startY.current;
    if (Math.abs(dy) > Math.abs(dx) * 1.4) {
      return;
    }

    if (Math.abs(dx) > 6) {
      moved.current = true;
      if (!captured.current) {
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
          captured.current = true;
        } catch {
          // 某些浏览器或合成事件不支持指针捕获，忽略即可
        }
      }
    }

    const width = event.currentTarget.clientWidth;
    let clamped = Math.max(Math.min(dx, width), -width);
    if (index === 0) {
      clamped = Math.min(clamped, 0);
    }
    if (index === COUNT - 1) {
      clamped = Math.max(clamped, 0);
    }

    offsetRef.current = clamped;
    setOffset(clamped);
  }

  function handlePointerUp() {
    if (activePointer.current === null) {
      return;
    }

    const dx = offsetRef.current;
    activePointer.current = null;
    captured.current = false;
    setDragging(false);
    setPaused(false);
    setOffset(0);
    offsetRef.current = 0;

    if (dx < -60) {
      go(1);
    } else if (dx > 60) {
      go(-1);
    }
  }

  const trackStyle: React.CSSProperties = {
    transform: `translateX(calc(${-index * 100}% + ${offset}px))`,
    transition:
      dragging || instant
        ? "none"
        : "transform 420ms cubic-bezier(0.22,1,0.36,1)",
  };

  return (
    <section
      className="glass carousel-track relative select-none overflow-hidden rounded-3xl p-5 shadow-lg shadow-[#5c6b62]/10 sm:p-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/40 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-amber-200/40 blur-2xl" />

      <div className="relative flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.18em] text-indigo-500">
          广场大屏 · 搭子头条
        </span>
        <div className="flex items-center gap-2">
          <CountdownRing progress={progress} />
          <Link
            href="/promote"
            className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-500 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-md shadow-indigo-200 transition duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            上 C 位
          </Link>
        </div>
      </div>

      <div className="relative mt-3 overflow-hidden">
        <div className="flex" style={trackStyle} data-carousel-track>
          {featuredItems.map((item) => {
            const tag = getTag(item.tagId);
            const group = getGroup(tag.groupId);
            const hoursLeft =
              now === null
                ? Number.POSITIVE_INFINITY
                : (new Date(item.endAt).getTime() - now) / 3600_000;
            const remaining =
              now === null ? "剩余 --:--" : formatRemaining(item.endAt, now);
            const remainingClass =
              now === null
                ? "text-[#7b8a80]"
                : remaining === "已结束" || hoursLeft < 1
                  ? "text-rose-500"
                  : hoursLeft < 24
                    ? "text-amber-600"
                    : "text-[#7b8a80]";

            return (
              <div
                key={item.id}
                className="w-full shrink-0"
                data-carousel-slide
              >
                <button
                  type="button"
                  onClick={(event) => {
                    if (moved.current) {
                      moved.current = false;
                      return;
                    }
                    track("promotion_click", {
                      itemId: item.id,
                      postId: item.postId,
                    });
                    onOpen?.(
                      item,
                      event.currentTarget.getBoundingClientRect(),
                    );
                  }}
                  className="w-full rounded-2xl text-left transition duration-200 active:scale-[0.99]"
                >
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${tag.badgeClass}`}
                  >
                    {tag.emoji} {tag.label}
                  </span>
                  <h2 className="mt-2.5 text-base font-semibold leading-snug text-slate-900 sm:text-lg">
                    {item.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#5c6b62] sm:text-[13px]">
                    {item.summary}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-[#7b8a80]">{item.author}</span>
                    <span className={`font-medium ${remainingClass}`}>
                      {remaining}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between">
        <div className="flex gap-1.5">
          {featuredItems.map((entry, entryIndex) => (
            <button
              key={entry.id}
              type="button"
              data-no-drag
              aria-label={`查看第 ${entryIndex + 1} 条`}
              onClick={() => {
                progressRef.current = 0;
                setProgress(0);
                setIndex(entryIndex);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                entryIndex === index ? "w-5 bg-indigo-600" : "w-1.5 bg-slate-300"
              }`}
            />
          ))}
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            data-no-drag
            onClick={() => go(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/80 text-xs text-slate-500 transition hover:bg-white active:scale-90"
            aria-label="上一条"
          >
            ←
          </button>
          <button
            type="button"
            data-no-drag
            onClick={() => go(1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/80 text-xs text-slate-500 transition hover:bg-white active:scale-90"
            aria-label="下一条"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
