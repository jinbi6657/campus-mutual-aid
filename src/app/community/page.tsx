"use client";

import { useEffect, useMemo, useState } from "react";
import { CommunityComposer } from "@/components/CommunityComposer";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import { ScrollRow } from "@/components/ScrollRow";
import { track } from "@/lib/analytics";
import { findUser, loadSession } from "@/lib/auth";
import {
  addCommunityComment,
  addCommunityTopic,
  deleteCommunityPost,
  loadCommunityComments,
  loadCommunityLikes,
  loadCommunityPosts,
  loadCommunityTopics,
  loadFollowedTopics,
  toggleFollowedTopic,
  toggleCommunityLike,
  updateCommunityPostStatus,
} from "@/lib/store";
import type {
  CommunityComment,
  CommunityPost,
  CommunityTopic,
} from "@/lib/types";

export default function CommunityPage() {
  const [loaded, setLoaded] = useState(false);
  const [nickname, setNickname] = useState("同学");
  const [topics, setTopics] = useState<CommunityTopic[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [reviewMode, setReviewMode] = useState(false);
  const [feedFilter, setFeedFilter] = useState<
    "all" | "mine" | "participated" | "followed"
  >("all");
  const [visibleCount, setVisibleCount] = useState(10);
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [topicName, setTopicName] = useState("");
  const [topicDesc, setTopicDesc] = useState("");

  useEffect(() => {
    const session = loadSession();
    const user = session ? findUser(session.studentId) : null;
    setNickname(user?.name ?? "同学");
    setIsAdmin(user?.role === "admin");
    setTopics(loadCommunityTopics());
    setPosts(loadCommunityPosts());
    setComments(loadCommunityComments());
    setLikes(loadCommunityLikes());
    setFollowedTopics(loadFollowedTopics());
    setLoaded(true);
  }, []);

  function refresh() {
    setPosts(loadCommunityPosts());
    setComments(loadCommunityComments());
  }

  const pendingPosts = useMemo(
    () => posts.filter((post) => post.status === "pending"),
    [posts],
  );

  const visiblePosts = useMemo(() => {
    return posts
      .filter((post) => {
        if (post.status === "rejected" && !post.isMine) {
          return false;
        }
        if (post.status === "pending" && !post.isMine && !reviewMode) {
          return false;
        }
        if (selectedTopic !== "all" && post.topicId !== selectedTopic) {
          return false;
        }
        if (feedFilter === "mine" && !post.isMine) {
          return false;
        }
        if (feedFilter === "participated") {
          const participated = comments.some(
            (comment) =>
              comment.postId === post.id && comment.author === nickname,
          );
          if (!participated) {
            return false;
          }
        }
        if (
          feedFilter === "followed" &&
          !followedTopics.includes(post.topicId)
        ) {
          return false;
        }
        return true;
      })
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      );
  }, [
    posts,
    selectedTopic,
    reviewMode,
    feedFilter,
    comments,
    nickname,
    followedTopics,
  ]);

  const displayedPosts = visiblePosts.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(10);
  }, [selectedTopic, feedFilter]);

  if (!loaded) {
    return (
      <main className="mx-auto w-full max-w-3xl pt-10">
        <div className="card-soft h-40 animate-pulse rounded-3xl" />
      </main>
    );
  }

  function handleCreateTopic() {
    if (!topicName.trim()) {
      return;
    }
    const topic: CommunityTopic = {
      id: `topic-${Date.now()}`,
      name: topicName.trim().slice(0, 12),
      description: topicDesc.trim().slice(0, 40) || "同学们自己创建的小社区",
      emoji: "💡",
      official: false,
      createdAt: new Date().toISOString(),
    };
    addCommunityTopic(topic);
    setTopics(loadCommunityTopics());
    setTopicName("");
    setTopicDesc("");
    setShowTopicForm(false);
    setSelectedTopic(topic.id);
  }

  return (
    <main className="animate-fade-up mx-auto flex w-full max-w-3xl flex-col pt-6">
      <div className="glass rounded-3xl p-5 shadow-lg shadow-[#5c6b62]/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">💬 校园圈</h1>
            <p className="mt-1 text-xs text-[#7b8a80]">
              邀请制 · 仅限本校 · 话题广场与小社区
            </p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-[11px] font-medium text-indigo-600">
            {nickname}
          </span>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-[#9aa7a0]">
          发帖和评论都会经过机器预审，命中风险的内容会进入人工复核；请勿发布广告、隐私信息和攻击性内容。
        </p>
      </div>

      <ScrollRow className="mt-4 cursor-grab active:cursor-grabbing">
        <button
          type="button"
          onClick={() => setSelectedTopic("all")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition active:scale-95 ${
            selectedTopic === "all"
              ? "bg-slate-900 text-white"
              : "bg-[#fffdfa] text-[#5c6b62] shadow-sm"
          }`}
        >
          全部
        </button>
        {topics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            onClick={() => setSelectedTopic(topic.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition active:scale-95 ${
              selectedTopic === topic.id
                ? "bg-slate-900 text-white"
                : "bg-[#fffdfa] text-[#5c6b62] shadow-sm"
            }`}
          >
            {topic.emoji} {topic.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowTopicForm((value) => !value)}
          className="shrink-0 rounded-full bg-amber-50 px-3.5 py-1.5 text-xs font-medium text-amber-700 shadow-sm transition active:scale-95"
        >
          ＋ 创建话题
        </button>
      </ScrollRow>

      {selectedTopic !== "all" ? (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-[#7b8a80]">
          <button
            type="button"
            onClick={() => {
              const next = toggleFollowedTopic(selectedTopic);
              setFollowedTopics(loadFollowedTopics());
              track("topic_follow", { topicId: selectedTopic, follow: next });
            }}
            className={`rounded-full px-3 py-1.5 font-medium transition active:scale-95 ${
              followedTopics.includes(selectedTopic)
                ? "bg-amber-100 text-amber-700"
                : "bg-[#f2f5ef] text-[#5c6b62]"
            }`}
          >
            {followedTopics.includes(selectedTopic)
              ? "★ 已关注该话题"
              : "☆ 关注该话题"}
          </button>
          <span>关注后可在"我关注的话题"里快速查看</span>
        </div>
      ) : null}

      {showTopicForm ? (
        <section className="card-soft mt-3 rounded-3xl p-4">
          <p className="text-xs font-medium text-[#5c6b62]">
            创建一个小社区
          </p>
          <input
            value={topicName}
            onChange={(event) => setTopicName(event.target.value.slice(0, 12))}
            placeholder="话题名称，最多 12 个字"
            className="mt-2 w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
          <input
            value={topicDesc}
            onChange={(event) => setTopicDesc(event.target.value.slice(0, 40))}
            placeholder="一句话介绍，最多 40 个字"
            className="mt-2 w-full rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setShowTopicForm(false)}
              className="flex-1 rounded-xl border border-[#e3e9df] py-2.5 text-xs text-[#7b8a80]"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleCreateTopic}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-medium text-white"
            >
              创建
            </button>
          </div>
        </section>
      ) : null}

      <div className="mt-3 flex items-center justify-between">
        {isAdmin ? (
          <button
            type="button"
            onClick={() => setReviewMode((value) => !value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition active:scale-95 ${
              reviewMode
                ? "bg-amber-500 text-white"
                : "bg-[#fffdfa] text-[#7b8a80] shadow-sm"
            }`}
          >
            审核队列（演示）：{pendingPosts.length}
          </button>
        ) : (
          <span />
        )}
        <span className="text-[11px] text-[#9aa7a0]">
          共 {visiblePosts.length} 条内容
        </span>
      </div>

      {reviewMode && isAdmin ? (
        <section className="mt-3 space-y-3">
          {pendingPosts.length === 0 ? (
            <div className="card-soft rounded-3xl p-6 text-center text-sm text-[#7b8a80]">
              当前没有待审核内容。
            </div>
          ) : (
            pendingPosts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                topic={topics.find((topic) => topic.id === post.topicId)}
                comments={[]}
                liked={false}
                onLike={() => undefined}
                onAddComment={() => undefined}
                onApprove={() => {
                  updateCommunityPostStatus(post.id, "approved");
                  refresh();
                }}
                onReject={() => {
                  updateCommunityPostStatus(post.id, "rejected");
                  refresh();
                }}
              />
            ))
          )}
        </section>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            {[
              { id: "all", label: "全部" },
              { id: "mine", label: "我的帖子" },
              { id: "participated", label: "我参与的" },
              { id: "followed", label: "我关注的话题" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setFeedFilter(
                    item.id as "all" | "mine" | "participated" | "followed",
                  )
                }
                className={`rounded-full px-3 py-1.5 transition active:scale-95 ${
                  feedFilter === item.id
                    ? "bg-slate-900 text-white"
                    : "bg-[#fffdfa] text-[#5c6b62] shadow-sm"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-3">
            <CommunityComposer
              topics={topics}
              nickname={nickname}
              onCreated={refresh}
            />
          </div>

          <section className="mt-4 space-y-3">
            {visiblePosts.length === 0 ? (
              <div className="card-soft rounded-3xl p-6 text-center text-sm text-[#7b8a80]">
                这个话题还没有内容，来发第一条吧。
              </div>
            ) : (
              displayedPosts.map((post) => {
                const postComments = comments.filter(
                  (comment) => comment.postId === post.id,
                );
                return (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    topic={topics.find((topic) => topic.id === post.topicId)}
                    comments={postComments}
                    liked={Boolean(likes[post.id])}
                    onLike={() => {
                      toggleCommunityLike(post.id);
                      setLikes(loadCommunityLikes());
                    }}
                    onAddComment={(content) => {
                      addCommunityComment({
                        id: `cc-${Date.now()}`,
                        postId: post.id,
                        author: nickname,
                        content,
                        createdAt: new Date().toISOString(),
                        status: "approved",
                      });
                      refresh();
                    }}
                    onDelete={
                      post.isMine
                        ? () => {
                            deleteCommunityPost(post.id);
                            refresh();
                          }
                        : undefined
                    }
                  />
                );
              })
            )}
            {visiblePosts.length > displayedPosts.length ? (
              <button
                type="button"
                onClick={() => setVisibleCount((value) => value + 10)}
                className="w-full rounded-2xl bg-[#fffdfa]/80 py-3 text-xs text-[#5c6b62] shadow-sm backdrop-blur"
              >
                加载更多（还有 {visiblePosts.length - displayedPosts.length} 条）
              </button>
            ) : null}
          </section>
        </>
      )}
    </main>
  );
}
