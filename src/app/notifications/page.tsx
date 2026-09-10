"use client";

import { useEffect, useState } from "react";
import { loadSession } from "@/lib/auth";
import {
  loadNotifications,
  markAllNotificationsRead,
  type AppNotification,
} from "@/lib/notifications";

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      return;
    }
    setUserId(session.studentId);
    setItems(
      loadNotifications().filter(
        (item) => item.userId === session.studentId,
      ),
    );
  }, []);

  return (
    <main className="animate-fade-up mx-auto flex w-full max-w-2xl flex-col pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">🔔 通知</h1>
        {items.some((item) => !item.read) ? (
          <button
            type="button"
            onClick={() => {
              markAllNotificationsRead(userId);
              setItems(
                loadNotifications().filter(
                  (item) => item.userId === userId,
                ),
              );
            }}
            className="rounded-full bg-[#fffdfa] px-3.5 py-1.5 text-xs text-[#5c6b62] shadow-sm"
          >
            全部标记已读
          </button>
        ) : null}
      </div>

      <section className="mt-4 space-y-2">
        {items.length === 0 ? (
          <div className="card-soft rounded-3xl p-8 text-center text-sm text-[#7b8a80]">
            还没有通知。
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`rounded-3xl border border-white/60 p-4 shadow-[0_8px_30px_rgba(31,41,51,0.08)] backdrop-blur-md ${
                item.read ? "bg-[#fffdfa]/60" : "bg-[#fffdfa]/85"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">
                  {!item.read ? "🔴 " : ""}
                  {item.title}
                </p>
                <span className="text-[11px] text-[#9aa7a0]">
                  {new Date(item.createdAt).toLocaleString("zh-CN", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#5c6b62]">
                {item.content}
              </p>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
