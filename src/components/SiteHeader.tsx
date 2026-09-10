"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, findUser, loadSession } from "@/lib/auth";
import { unreadCount } from "@/lib/notifications";

const links = [
  { href: "/", label: "发现" },
  { href: "/match", label: "AI 匹配" },
  { href: "/publish", label: "发布" },
  { href: "/community", label: "校园圈" },
  { href: "/profile", label: "我的" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const session = loadSession();
    if (session) {
      const user = findUser(session.studentId);
      setIsAdmin(user?.role === "admin");
      setUnread(unreadCount(session.studentId));
    } else {
      setUnread(0);
    }
  }, [pathname]);

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <header className="glass sticky top-0 z-50 hidden border-b border-white/40 md:block">
      <div className="mx-auto flex h-16 w-full max-w-[1320px] items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-sm font-bold text-white">
            搭
          </span>
          <span className="text-lg font-bold text-slate-900">搭友</span>
        </Link>

        <div className="flex items-center gap-1">
          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const active = pathname === link.href;

              if (link.href === "/match") {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`ml-2 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 ${
                      active ? "ring-2 ring-white" : ""
                    }`}
                  >
                    ✨ AI 匹配
                  </Link>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm transition duration-200 active:scale-95 ${
                    active
                      ? "bg-slate-900 font-medium text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {isAdmin ? (
            <Link
              href="/admin"
              className="ml-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition active:scale-95"
            >
              🛠️ 管理端
            </Link>
          ) : null}

          <Link
            href="/notifications"
            className="relative ml-1 flex h-9 w-9 items-center justify-center rounded-full text-lg transition hover:bg-slate-100 active:scale-95"
            aria-label="通知"
          >
            🔔
            {unread > 0 ? (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-medium text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="ml-1 rounded-full px-3 py-2 text-xs text-[#9aa7a0] transition hover:bg-slate-100 active:scale-95"
          >
            退出
          </button>
        </div>
      </div>
    </header>
  );
}
