"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTagDisplay, groups } from "@/lib/categories";
import {
  promotionDurations,
  promotionTiers,
  type PromotionTierId,
} from "@/lib/featured";
import { loadPosts } from "@/lib/store";
import { addPromotion } from "@/lib/store";
import type { Post } from "@/lib/types";

function tierLabel(tierId: PromotionTierId): string {
  const tier = promotionTiers.find((item) => item.id === tierId);
  return tier?.name ?? "推广";
}

function tierBadge(tierId: PromotionTierId): string {
  if (tierId === "main") {
    return "👑 主屏 C 位";
  }
  if (tierId === "category_top") {
    return "📌 分类置顶";
  }
  return "👑 头条轮播";
}

export default function PromotePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postId, setPostId] = useState("");
  const [tierId, setTierId] = useState<PromotionTierId>("rotation");
  const [durationId, setDurationId] = useState("3d");
  const [groupId, setGroupId] = useState("study");
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const list = loadPosts();
    setPosts(list);
    if (list.length > 0) {
      setPostId(list[0].id);
    }
  }, []);

  const selectedPost = posts.find((post) => post.id === postId);
  const tier =
    promotionTiers.find((item) => item.id === tierId) ?? promotionTiers[1];
  const duration =
    promotionDurations.find((item) => item.id === durationId) ??
    promotionDurations[1];
  const price = tier.prices[durationId] ?? null;
  const group = groups.find((item) => item.id === groupId) ?? groups[0];

  function handlePay() {
    const now = Date.now();
    const days = duration.days ?? 3;
    addPromotion({
      id: `promo-${now}`,
      postId,
      tier: tierId,
      durationId,
      price: price ?? 0,
      status: "pending_review",
      createdAt: new Date(now).toISOString(),
      endAt: new Date(now + days * 86400_000).toISOString(),
      impressions: 0,
      clicks: 0,
    });
    setPaid(true);
  }

  function selectTier(id: PromotionTierId) {
    setTierId(id);
    const option = promotionTiers.find((item) => item.id === id);
    if (option && !option.prices[durationId]) {
      const firstSupported = promotionDurations.find(
        (item) => option.prices[item.id],
      );
      if (firstSupported) {
        setDurationId(firstSupported.id);
      }
    }
  }

  if (paid) {
    return (
      <main className="animate-fade-up mx-auto flex w-full max-w-2xl flex-col pt-10 text-center">
        <div className="glass rounded-3xl p-8 shadow-lg shadow-[#5c6b62]/10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-2xl text-white">
            ✓
          </div>
          <h1 className="mt-4 text-lg font-bold text-slate-900">
            模拟支付成功，已提交审核
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-[#7b8a80]">
            MVP 阶段使用模拟支付，用于验证流程和付费意愿。审核通过后，你的需求会按所选层级开始展示。
          </p>

          <div className="mt-5 rounded-2xl bg-[#fffdfa] p-4 text-left text-xs text-[#5c6b62]">
            <p>
              推广层级：<span className="font-medium">{tier.name}</span>
            </p>
            <p className="mt-1">
              展示时长：<span className="font-medium">{duration.label}</span>
            </p>
            {tierId === "category_top" ? (
              <p className="mt-1">
                展示位置：
                <span className="font-medium">
                  {group.emoji} {group.label} 列表顶部
                </span>
              </p>
            ) : null}
            <p className="mt-1">
              支付金额：<span className="font-medium">¥{price ?? "-"}</span>
            </p>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "曝光", value: "0" },
              { label: "点击", value: "0" },
              { label: "联系", value: "0" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/70 p-3">
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                <p className="mt-0.5 text-[11px] text-[#7b8a80]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <Link
              href="/profile"
              className="flex-1 rounded-xl bg-[#f2f5ef] py-3 text-center text-sm text-[#5c6b62]"
            >
              查看我的推广
            </Link>
            <Link
              href="/"
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 py-3 text-center text-sm font-semibold text-white shadow-md shadow-indigo-200 transition duration-200 active:scale-[0.98]"
            >
              回到首页
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="animate-fade-up mx-auto flex w-full max-w-3xl flex-col pt-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">上 C 位 · 推广</h1>
        <p className="mt-1 text-xs leading-relaxed text-[#7b8a80]">
          选择推广层级和时长，付费后展示在对应位置，被更多同学看到。
        </p>
      </div>

      <section className="card-soft mt-5 rounded-3xl p-5">
        <h2 className="text-sm font-semibold text-slate-800">
          1. 选择要推广的需求
        </h2>
        <div className="mt-3 space-y-2">
          {posts.slice(0, 8).map((post) => {
            const tag = getTagDisplay(post);
            const active = post.id === postId;
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => setPostId(post.id)}
                className={`w-full rounded-2xl border p-3 text-left transition duration-200 active:scale-[0.99] ${
                  active
                    ? "border-indigo-500 bg-indigo-50/60"
                    : "border-[#e8ece5] bg-white hover:border-[#d7dfd2]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${tag.badgeClass}`}
                  >
                    {tag.emoji} {tag.label}
                  </span>
                  {active ? (
                    <span className="text-[11px] font-medium text-indigo-600">
                      已选择
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {post.title}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card-soft mt-4 rounded-3xl p-5">
        <h2 className="text-sm font-semibold text-slate-800">
          2. 选择推广层级
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {promotionTiers.map((item) => {
            const active = item.id === tierId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTier(item.id)}
                className={`rounded-2xl border p-3 text-left transition duration-200 active:scale-[0.98] ${
                  active
                    ? "border-amber-400 bg-amber-50/70"
                    : "border-[#e8ece5] bg-white hover:border-[#d7dfd2]"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">
                  {item.name}
                </p>
                <p className="mt-0.5 text-[11px] text-amber-700">
                  ¥
                  {Math.min(
                    ...Object.values(item.prices).filter(
                      (value): value is number => typeof value === "number",
                    ),
                  )}{" "}
                  起
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#9aa7a0]">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>

        {tierId === "category_top" ? (
          <div className="mt-3">
            <p className="text-xs font-medium text-[#5c6b62]">
              选择置顶的大类
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {groups.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGroupId(item.id)}
                  className={`rounded-full px-3 py-1.5 text-xs transition active:scale-95 ${
                    groupId === item.id
                      ? "bg-amber-500 text-white"
                      : "bg-[#f2f5ef] text-[#5c6b62]"
                  }`}
                >
                  {item.emoji} {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="card-soft mt-4 rounded-3xl p-5">
        <h2 className="text-sm font-semibold text-slate-800">
          3. 选择展示时长
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {promotionDurations.map((item) => {
            const active = item.id === durationId;
            const itemPrice = tier.prices[item.id];
            return (
              <button
                key={item.id}
                type="button"
                disabled={!itemPrice}
                onClick={() => {
                  if (itemPrice) {
                    setDurationId(item.id);
                  }
                }}
                className={`rounded-2xl border p-3 text-left transition duration-200 active:scale-[0.98] ${
                  !itemPrice
                    ? "cursor-not-allowed border-[#eef2ea] bg-[#f7f8f4] opacity-60"
                    : active
                    ? "border-indigo-500 bg-indigo-50/60"
                    : "border-[#e8ece5] bg-white hover:border-[#d7dfd2]"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">
                  {item.label}
                </p>
                <p className="mt-1 text-[11px] text-[#9aa7a0]">
                  {itemPrice ? `¥${itemPrice}` : "该层级不支持此套餐"}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section
        className={`mt-4 rounded-3xl p-5 shadow-lg ${
          tierId === "category_top"
            ? "bg-gradient-to-b from-[#fffdf6] to-[#fffdfa] ring-2 ring-amber-200"
            : "glass ring-2 ring-amber-300/70"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-amber-700">
            预览 · {tierBadge(tierId)}
          </span>
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] text-[#7b8a80]">
            推广 · {duration.label}
          </span>
        </div>
        {selectedPost ? (
          <div className="mt-3">
            <span
              className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${
                getTagDisplay(selectedPost).badgeClass
              }`}
            >
              {getTagDisplay(selectedPost).emoji}{" "}
              {getTagDisplay(selectedPost).label}
            </span>
            <h3 className="mt-2 text-base font-semibold text-slate-900">
              {selectedPost.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#5c6b62]">
              {selectedPost.description}
            </p>
            {tierId === "category_top" ? (
              <p className="mt-2 text-[11px] text-amber-700">
                将展示在 {group.emoji} {group.label} 列表顶部
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#7b8a80]">请先选择一条需求。</p>
        )}
      </section>

      <button
        type="button"
        onClick={handlePay}
        disabled={!selectedPost || price === null}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-semibold text-white shadow-md shadow-amber-200 transition duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        模拟支付 ¥{price ?? "-"}，推广 {tierLabel(tierId)}
      </button>

      <p className="mt-3 text-[11px] leading-relaxed text-[#9aa7a0]">
        内容需要经过审核；禁止发布违法违规、虚假或涉及金钱交易诱导的信息。找室友、拼车、找 CP 等线下场景请务必注意人身与财产安全。
      </p>
    </main>
  );
}
