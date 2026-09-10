"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { addApplication, loadProfile } from "@/lib/store";
import { addNotification } from "@/lib/notifications";
import { loadSession } from "@/lib/auth";
import type { Post } from "@/lib/types";

export function CommunicationSheet({
  post,
  onClose,
}: {
  post: Post;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [profile, setProfile] = useState({
    name: "我",
    major: "",
    grade: "",
    skills: [] as string[],
  });

  useEffect(() => {
    setMounted(true);
    const saved = loadProfile();
    const next = {
      name: saved?.name?.trim() || "我",
      major: saved?.major ?? "",
      grade: saved?.grade ?? "",
      skills: saved?.skills ?? [],
    };
    setProfile(next);
    setMessage(
      `你好，我对「${post.title}」很感兴趣。我是${next.major || "本校"}${
        next.grade || ""
      }，${next.skills.length > 0 ? `擅长${next.skills.join("、")}。` : ""}希望能进一步聊聊，看看是否合适一起做这件事。`,
    );
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [post.title]);

  function handleSend() {
    const session = loadSession();
    addApplication({
      postId: post.id,
      applicantId: session?.studentId,
      message: message.trim() || "你好，我想进一步沟通。",
      applicantName: profile.name,
      applicantMajor: profile.major,
      applicantGrade: profile.grade,
      applicantSkills: profile.skills ?? [],
    });
    if (post.ownerId && post.ownerId !== session?.studentId) {
      addNotification({
        userId: post.ownerId,
        type: "application",
        title: "收到新的沟通申请",
        content: `有人对《${post.title}》发起了沟通，可在"收到的沟通"里查看。`,
      });
    }
    setSent(true);
  }

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center">
      <div
        className="fixed inset-0 bg-[#1f2933]/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="modal-pop relative w-full max-w-lg rounded-t-3xl bg-[#fffdfa] p-5 shadow-2xl sm:rounded-3xl">
        {sent ? (
          <>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-600">
                ✓
              </div>
              <h2 className="mt-3 text-base font-bold text-slate-900">
                沟通申请已发送
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[#7b8a80]">
                发布人会在「收到的沟通」里看到你的资料和留言，接受后可以继续交流。联系方式默认隐藏。
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 py-3 text-sm font-semibold text-white"
            >
              好的
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                发起沟通
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-[#9aa7a0]"
              >
                关闭
              </button>
            </div>

            <div className="mt-3 rounded-2xl bg-[#f2f5ef] p-3">
              <p className="text-[11px] text-[#7b8a80]">
                将同时发送你的资料卡
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {profile.name} · {profile.major || "未填写专业"} ·{" "}
                {profile.grade || "未填写年级"}
              </p>
              {profile.skills.length > 0 ? (
                <p className="mt-1 text-[11px] text-[#7b8a80]">
                  技能：{profile.skills.join("、")}
                </p>
              ) : null}
            </div>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              className="mt-3 w-full resize-none rounded-2xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-3 text-sm leading-relaxed outline-none focus:border-indigo-400"
            />
            <p className="mt-2 text-[11px] text-[#9aa7a0]">
              联系方式默认隐藏，双方同意后才会展示。
            </p>
            <button
              type="button"
              onClick={handleSend}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition active:scale-[0.98]"
            >
              发送沟通申请
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
