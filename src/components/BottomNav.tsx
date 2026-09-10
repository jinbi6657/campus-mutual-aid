"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "发现", icon: "🔍" },
  { href: "/match", label: "AI 匹配", icon: "✨", primary: true },
  { href: "/publish", label: "发布", icon: "📣" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass fixed bottom-0 left-0 right-0 z-50 grid grid-cols-3 items-center border-t border-white/50 py-1.5 md:hidden">
      {items.map((item) => {
        const active = pathname === item.href;

        if (item.primary) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 text-[11px]"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-lg text-white shadow-lg shadow-indigo-300/60 transition duration-200 active:scale-90 ${
                  active ? "scale-105 ring-2 ring-white" : ""
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`transition ${
                  active ? "font-semibold text-indigo-600" : "text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 rounded-lg py-1 text-[11px] transition duration-200 active:scale-90 ${
              active
                ? "scale-105 font-semibold text-indigo-600"
                : "text-slate-500"
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
