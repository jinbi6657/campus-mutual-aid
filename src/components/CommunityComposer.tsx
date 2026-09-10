"use client";

import { useState } from "react";
import { moderateContent } from "@/lib/moderation";
import { addCommunityPost } from "@/lib/store";
import { track } from "@/lib/analytics";
import { loadSession } from "@/lib/auth";
import type { CommunityPost, CommunityTopic } from "@/lib/types";

export function CommunityComposer({
  topics,
  nickname,
  onCreated,
}: {
  topics: CommunityTopic[];
  nickname: string;
  onCreated: () => void;
}) {
  const [content, setContent] = useState("");
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");

  function handleSubmit() {
    if (!content.trim()) {
      setMessage("写点内容再发吧。");
      return;
    }
    if (!topicId) {
      setMessage("请先选择一个话题。");
      return;
    }

    const result = moderateContent(content);
    const session = loadSession();
    const post: CommunityPost = {
      id: `cpost-${Date.now()}`,
      topicId,
      ownerId: session?.studentId,
      author: anonymous ? "匿名同学" : nickname,
      anonymous,
      content: content.trim().slice(0, 500),
      createdAt: new Date().toISOString(),
      likes: 0,
      status: result.status,
      moderationReasons: result.reasons,
      isMine: true,
    };
    addCommunityPost(post);
    track("community_post_create", {
      topicId,
      anonymous,
      pending: result.status !== "approved",
    });
    setContent("");
    setMessage(
      result.status === "approved"
        ? "发布成功。"
        : `已提交审核：${result.reasons.join("；")}。审核通过后其他同学才能看到。`,
    );
    onCreated();
  }

  return (
    <section className="card-soft rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">发一条</h2>
        <label className="flex items-center gap-2 text-[11px] text-[#7b8a80]">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(event) => setAnonymous(event.target.checked)}
            className="h-3.5 w-3.5 accent-indigo-600"
          />
          匿名发布
        </label>
      </div>

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value.slice(0, 500))}
        rows={4}
        placeholder="分享校园日常、吐槽、提问，或者发起一个小讨论…"
        className="mt-3 w-full resize-none rounded-2xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-3 text-sm leading-relaxed outline-none focus:border-indigo-400"
      />
      <p className="mt-1 text-right text-[11px] text-[#9aa7a0]">
        {content.length}/500
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {topics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            onClick={() => setTopicId(topic.id)}
            className={`rounded-full px-3 py-1.5 text-[11px] transition active:scale-95 ${
              topicId === topic.id
                ? "bg-indigo-600 text-white"
                : "bg-[#f2f5ef] text-[#5c6b62]"
            }`}
          >
            {topic.emoji} {topic.name}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="mt-3 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition active:scale-[0.98]"
      >
        发布
      </button>

      {message ? (
        <p className="mt-2 rounded-xl bg-[#f2f5ef] px-3 py-2 text-xs text-[#5c6b62]">
          {message}
        </p>
      ) : null}
    </section>
  );
}
