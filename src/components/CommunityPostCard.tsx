"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { findUser, loadSession } from "@/lib/auth";
import { moderateContent } from "@/lib/moderation";
import { addCommunityReport } from "@/lib/store";
import { addNotification } from "@/lib/notifications";
import type { CommunityComment, CommunityPost, CommunityTopic } from "@/lib/types";

const reportReasons = ["虚假信息", "广告骚扰", "人身攻击", "隐私泄露", "其他"];

function anonymousLabel(id: string): string {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 10000;
  }
  return `匿名同学#${String(hash).padStart(4, "0")}`;
}

export function CommunityPostCard({
  post,
  topic,
  comments,
  liked,
  onLike,
  onAddComment,
  onDelete,
  onApprove,
  onReject,
}: {
  post: CommunityPost;
  topic?: CommunityTopic;
  comments: CommunityComment[];
  liked: boolean;
  onLike: () => void;
  onAddComment: (content: string) => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [visibleComments, setVisibleComments] = useState(2);
  const [commentText, setCommentText] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [commentMessage, setCommentMessage] = useState("");

  function handleComment() {
    const text = commentText.trim();
    if (!text) {
      return;
    }
    const result = moderateContent(text);
    if (result.status === "pending") {
      setCommentMessage(`评论已提交审核：${result.reasons.join("；")}`);
      return;
    }
    onAddComment(text.slice(0, 200));
    const session = loadSession();
    if (post.ownerId && post.ownerId !== session?.studentId) {
      addNotification({
        userId: post.ownerId,
        type: "comment",
        title: "你的帖子有新评论",
        content: `有人评论了《${post.content.slice(0, 12)}…》：「${text.slice(
          0,
          20,
        )}」`,
      });
    }
    track("comment", { object: "community_post" });
    setCommentText("");
    setCommentMessage("评论成功。");
  }

  function handleReport(reason: string) {
    const session = loadSession();
    const user = session ? findUser(session.studentId) : null;
    addCommunityReport({
      id: `report-${Date.now()}`,
      postId: post.id,
      reason,
      createdAt: new Date().toISOString(),
      reporterId: session?.studentId,
      reporterName: user?.name,
    });
    track("report_submit", { source: "community", reason });
    setReported(true);
    setReportOpen(false);
  }

  const statusLabel =
    post.status === "pending"
      ? "审核中"
      : post.status === "rejected"
        ? "已驳回"
        : null;

  const visibleList = comments.slice(0, visibleComments);
  const displayAuthor = post.anonymous
    ? anonymousLabel(post.id)
    : post.author;

  return (
    <article className="rounded-3xl border border-white/60 bg-[#fffdfa]/75 p-5 shadow-[0_8px_30px_rgba(31,41,51,0.10)] backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {displayAuthor}
          </p>
          <p className="mt-0.5 text-[11px] text-[#9aa7a0]">
            {topic ? `${topic.emoji} ${topic.name} · ` : ""}
            {new Date(post.createdAt).toLocaleString("zh-CN", {
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {statusLabel ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700">
              {statusLabel}
            </span>
          ) : null}
          {onApprove && post.status === "pending" ? (
            <>
              <button
                type="button"
                onClick={onApprove}
                className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-600"
              >
                通过
              </button>
              <button
                type="button"
                onClick={onReject}
                className="rounded-full bg-[#f2f5ef] px-3 py-1.5 text-[11px] text-[#7b8a80]"
              >
                驳回
              </button>
            </>
          ) : null}
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#3e4c59]">
        {post.content}
      </p>

      {post.status === "pending" && post.moderationReasons.length > 0 ? (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          待审核原因：{post.moderationReasons.join("；")}
        </p>
      ) : null}

      {reported ? (
        <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-600">
          举报已提交，处理中；处理结果会通过通知告诉你。
        </p>
      ) : null}

      <div className="mt-3 flex items-center gap-3 border-t border-[#eef2ea] pt-3 text-[12px] text-[#7b8a80]">
        <button
          type="button"
          onClick={() => {
            track("like", { object: "community_post" });
            onLike();
          }}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition active:scale-95 ${
            liked ? "bg-rose-50 text-rose-500" : "hover:bg-[#f2f5ef]"
          }`}
        >
          {liked ? "❤️" : "🤍"} {post.likes + (liked ? 1 : 0)}
        </button>
        <button
          type="button"
          onClick={() => setShowComments((value) => !value)}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 transition hover:bg-[#f2f5ef] active:scale-95"
        >
          💬 {comments.length}
        </button>
        <button
          type="button"
          onClick={() => setReportOpen((value) => !value)}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 transition hover:bg-[#f2f5ef] active:scale-95"
        >
          举报
        </button>
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto text-[11px] text-[#9aa7a0]"
          >
            删除
          </button>
        ) : null}
      </div>

      {reportOpen ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {reportReasons.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => handleReport(reason)}
              className="rounded-full bg-[#f2f5ef] px-3 py-1.5 text-[11px] text-[#7b8a80] transition hover:bg-rose-50 hover:text-rose-600"
            >
              {reason}
            </button>
          ))}
        </div>
      ) : null}

      {showComments ? (
        <div className="mt-3 space-y-2">
          {visibleList.map((comment) => (
            <div
              key={comment.id}
              className="rounded-2xl bg-[#f7f8f4] px-3 py-2"
            >
              <p className="text-[11px] text-[#9aa7a0]">{comment.author}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-[#5c6b62]">
                {comment.content}
              </p>
            </div>
          ))}

          {comments.length > visibleComments ? (
            <button
              type="button"
              onClick={() => setVisibleComments((value) => value + 10)}
              className="w-full rounded-xl bg-[#f2f5ef] py-2 text-[11px] text-[#5c6b62]"
            >
              查看更多评论（共 {comments.length} 条）
            </button>
          ) : null}

          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={(event) =>
                setCommentText(event.target.value.slice(0, 200))
              }
              placeholder="友善地聊两句…"
              className="flex-1 rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3 py-2 text-xs outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              onClick={handleComment}
              className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-medium text-white"
            >
              发送
            </button>
          </div>
          {commentMessage ? (
            <p className="text-[11px] text-[#9aa7a0]">{commentMessage}</p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
