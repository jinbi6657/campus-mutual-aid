"use client";

import { useEffect, useState } from "react";
import {
  clearAnalyticsEvents,
  loadAnalyticsEvents,
  summarizeEvents,
  type AnalyticsEvent,
} from "@/lib/analytics";

export function AnalyticsDebugPanel() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);

  useEffect(() => {
    function refresh() {
      setEvents(loadAnalyticsEvents());
    }
    refresh();
    const timer = window.setInterval(refresh, 2000);
    return () => window.clearInterval(timer);
  }, []);

  const summary = summarizeEvents(events);

  return (
    <div className="fixed bottom-20 right-3 z-[90] md:bottom-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-base text-white shadow-lg backdrop-blur"
        aria-label="埋点调试"
      >
        📈
      </button>
      {open ? (
        <div className="absolute bottom-12 right-0 w-72 rounded-2xl border border-white/60 bg-[#fffdfa]/95 p-3 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-900">
              埋点调试（演示）
            </p>
            <button
              type="button"
              onClick={() => {
                clearAnalyticsEvents();
                setEvents([]);
              }}
              className="text-[11px] text-[#9aa7a0]"
            >
              清空
            </button>
          </div>
          <p className="mt-1 text-[11px] text-[#7b8a80]">
            共 {summary.total} 条 · 今日 {summary.today} 条
          </p>
          <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
            {summary.recent.slice(0, 20).map((event) => (
              <div
                key={event.id}
                className="rounded-lg bg-[#f2f5ef] px-2 py-1.5 text-[11px] text-[#5c6b62]"
              >
                <span className="font-medium">{event.event}</span>
                <span className="ml-1 text-[#9aa7a0]">{event.page}</span>
              </div>
            ))}
            {summary.recent.length === 0 ? (
              <p className="text-[11px] text-[#9aa7a0]">还没有事件。</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
