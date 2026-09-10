"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RiverBackground } from "@/components/RiverBackground";
import { changePassword, findUser, loadSession } from "@/lib/auth";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit() {
    const session = loadSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    if (newPassword !== confirm) {
      setMessage("两次输入的新密码不一致。");
      return;
    }
    const result = changePassword(session.studentId, oldPassword, newPassword);
    if (!result.ok) {
      setMessage(result.error ?? "修改失败");
      return;
    }
    const user = findUser(session.studentId);
    router.replace(user?.role === "admin" ? "/admin" : "/");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f7f1]">
      <RiverBackground variant="full" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5">
        <div className="glass w-full max-w-md rounded-3xl p-6 shadow-2xl shadow-[#5c6b62]/20">
        <h1 className="text-lg font-bold text-slate-900">首次登录，请修改密码</h1>
        <p className="mt-2 text-xs leading-relaxed text-[#7b8a80]">
          初始密码只用于第一次登录。新密码至少 8 位，包含字母和数字，且不能与学号相同。
        </p>

        <div className="mt-5 space-y-3">
          <input
            type="password"
            value={oldPassword}
            onChange={(event) => setOldPassword(event.target.value)}
            placeholder="初始密码"
            className="w-full rounded-xl border border-white/70 bg-white/80 px-3.5 py-3 text-sm outline-none focus:border-indigo-400"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="新密码"
            className="w-full rounded-xl border border-white/70 bg-white/80 px-3.5 py-3 text-sm outline-none focus:border-indigo-400"
          />
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="确认新密码"
            className="w-full rounded-xl border border-white/70 bg-white/80 px-3.5 py-3 text-sm outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition active:scale-[0.98]"
          >
            修改并进入
          </button>
          {message ? (
            <p className="rounded-xl bg-white/80 px-3 py-2 text-xs text-rose-600">
              {message}
            </p>
          ) : null}
        </div>
        </div>
      </div>
    </div>
  );
}
