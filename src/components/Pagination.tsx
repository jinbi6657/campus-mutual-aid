"use client";

import { useMemo, useState } from "react";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
}) {
  const [input, setInput] = useState("");

  const pages = useMemo(() => {
    const list: (number | "ellipsis")[] = [];
    if (totalPages <= 6) {
      for (let index = 1; index <= totalPages; index += 1) {
        list.push(index);
      }
      return list;
    }
    if (page <= 4) {
      for (let index = 1; index <= 5; index += 1) {
        list.push(index);
      }
      list.push("ellipsis");
      list.push(totalPages);
      return list;
    }
    if (page >= totalPages - 3) {
      list.push(1);
      list.push("ellipsis");
      for (let index = totalPages - 4; index <= totalPages; index += 1) {
        list.push(index);
      }
      return list;
    }
    list.push(1);
    list.push("ellipsis");
    for (let index = page - 1; index <= page + 2; index += 1) {
      list.push(index);
    }
    list.push("ellipsis");
    list.push(totalPages);
    return list;
  }, [page, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  function jump() {
    const parsed = Number.parseInt(input, 10);
    if (Number.isNaN(parsed)) {
      return;
    }
    onChange(Math.min(Math.max(parsed, 1), totalPages));
    setInput("");
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="rounded-full bg-[#fffdfa] px-3 py-1.5 text-xs text-[#5c6b62] shadow-sm transition active:scale-95 disabled:opacity-40"
      >
        上一页
      </button>
      {pages.map((entry, index) =>
        entry === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="px-1 text-xs text-[#9aa7a0]"
          >
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onChange(entry)}
            className={`h-8 min-w-8 rounded-full px-2 text-xs transition active:scale-95 ${
              entry === page
                ? "bg-slate-900 font-medium text-white"
                : "bg-[#fffdfa] text-[#5c6b62] shadow-sm"
            }`}
          >
            {entry}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-full bg-[#fffdfa] px-3 py-1.5 text-xs text-[#5c6b62] shadow-sm transition active:scale-95 disabled:opacity-40"
      >
        下一页
      </button>
      {totalPages > 6 ? (
        <div className="ml-1 flex items-center gap-1.5 text-[11px] text-[#7b8a80]">
          <span>跳至</span>
          <input
            value={input}
            onChange={(event) =>
              setInput(event.target.value.replace(/[^\d]/g, ""))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                jump();
              }
            }}
            inputMode="numeric"
            className="w-12 rounded-lg border border-white/70 bg-[#fffdfa]/90 px-2 py-1 text-center text-xs outline-none focus:border-indigo-400"
          />
          <span>/ {totalPages} 页</span>
          <button
            type="button"
            onClick={jump}
            className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white"
          >
            跳转
          </button>
        </div>
      ) : null}
    </div>
  );
}
