"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface FilterState {
  publishTime: "all" | "today" | "3d" | "7d";
  deadline: "all" | "24h" | "3d";
  grade: "all" | "大一" | "大二" | "大三" | "大四" | "研究生";
}

const publishOptions: { value: FilterState["publishTime"]; label: string }[] = [
  { value: "all", label: "不限" },
  { value: "today", label: "今天" },
  { value: "3d", label: "3 天内" },
  { value: "7d", label: "7 天内" },
];

const deadlineOptions: { value: FilterState["deadline"]; label: string }[] = [
  { value: "all", label: "不限" },
  { value: "24h", label: "24 小时内" },
  { value: "3d", label: "3 天内" },
];

const gradeOptions: { value: FilterState["grade"]; label: string }[] = [
  { value: "all", label: "不限" },
  { value: "大一", label: "大一" },
  { value: "大二", label: "大二" },
  { value: "大三", label: "大三" },
  { value: "大四", label: "大四" },
  { value: "研究生", label: "研究生" },
];

export function FilterSheet({
  value,
  onChange,
  onClose,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted) {
    return null;
  }

  function renderOptions<T extends string>(
    options: { value: T; label: string }[],
    current: T,
    onSelect: (value: T) => void,
  ) {
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs transition duration-200 active:scale-95 ${
              current === option.value
                ? "bg-indigo-600 text-white"
                : "bg-[#f2f5ef] text-[#5c6b62]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center">
      <div
        className="fixed inset-0 bg-[#1f2933]/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="modal-pop relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[#fffdfa] p-5 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">筛选</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#9aa7a0]"
          >
            关闭
          </button>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-[#5c6b62]">发布时间</p>
          {renderOptions(publishOptions, draft.publishTime, (next) =>
            setDraft({ ...draft, publishTime: next }),
          )}
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-[#5c6b62]">截止时间</p>
          {renderOptions(deadlineOptions, draft.deadline, (next) =>
            setDraft({ ...draft, deadline: next }),
          )}
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-[#5c6b62]">年级要求</p>
          {renderOptions(gradeOptions, draft.grade, (next) =>
            setDraft({ ...draft, grade: next }),
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              const reset: FilterState = {
                publishTime: "all",
                deadline: "all",
                grade: "all",
              };
              setDraft(reset);
              onChange(reset);
              onClose();
            }}
            className="flex-1 rounded-xl border border-[#e3e9df] py-3 text-sm text-[#5c6b62]"
          >
            重置
          </button>
          <button
            type="button"
            onClick={() => {
              onChange(draft);
              onClose();
            }}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 py-3 text-sm font-semibold text-white"
          >
            完成
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
