"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSession } from "@/lib/auth";
import { unreadCount } from "@/lib/notifications";

export function MobileHeader() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const session = loadSession();
    setUnread(session ? unreadCount(session.studentId) : 0);
  }, [pathname]);

  return (
    <header className="glass sticky top-0 z-50 border-b border-white/50 md:hidden">
      <div className="mx-auto flex h-14 w-full items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-sm font-bold text-white">
            搭
          </span>
          <span className="text-base font-bold text-slate-900">搭友</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/community"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-base shadow-sm transition active:scale-90"
            aria-label="校园圈"
          >
            💬
          </Link>
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-base shadow-sm transition active:scale-90"
            aria-label="个人中心"
          >
            👤
          </Link>
          <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-base shadow-sm transition active:scale-90"
            aria-label="通知"
          >
            🔔
            {unread > 0 ? (
              <span className="absolute right-0 top-0 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-medium text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
