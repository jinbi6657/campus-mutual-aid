"use client";

import { useState } from "react";
import { saveCommunityInvite } from "@/lib/store";

export function InviteGate({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.trim().toUpperCase() !== "CAMPUS2026") {
      setError("邀请码不正确，请向校园大使获取");
      return;
    }
    if (!nickname.trim()) {
      setError("请填写一个昵称");
      return;
    }
    saveCommunityInvite({
      code: code.trim().toUpperCase(),
      nickname: nickname.trim(),
      createdAt: new Date().toISOString(),
    });
    onDone();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col pt-10">
      <div className="glass rounded-3xl p-6 shadow-lg shadow-[#5c6b62]/10">
        <div className="text-center">
          <span className="text-3xl">💬</span>
          <h1 className="mt-3 text-lg font-bold text-slate-900">校园圈</h1>
          <p className="mt-2 text-xs leading-relaxed text-[#7b8a80]">
            校园圈目前是邀请制，仅限本校同学。输入邀请码和昵称后即可进入话题广场。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-[#5c6b62]">邀请码</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="例如：CAMPUS2026"
              className="mt-1.5 w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[#5c6b62]">昵称</span>
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="例如：小林"
              className="mt-1.5 w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition active:scale-[0.98]"
          >
            进入校园圈
          </button>
        </form>

        {error ? (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">
            {error}
          </p>
        ) : null}

        <p className="mt-4 rounded-xl bg-[#f2f5ef] px-3 py-2 text-[11px] leading-relaxed text-[#7b8a80]">
          演示邀请码：CAMPUS2026。正式版本会由校园大使发放邀请码，并绑定校园身份。
        </p>
      </div>
    </main>
  );
}
