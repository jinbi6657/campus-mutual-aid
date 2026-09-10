"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { FilterSheet, type FilterState } from "@/components/FilterSheet";
import { Pagination } from "@/components/Pagination";
import { PostCard } from "@/components/PostCard";
import { PostModal } from "@/components/PostModal";
import { ScrollRow } from "@/components/ScrollRow";
import {
  getTag,
  getTagsByGroup,
  groups,
  hotTagIds,
} from "@/lib/categories";
import type { FeaturedItem } from "@/lib/featured";
import { track } from "@/lib/analytics";
import { getCategoryTopPromotions } from "@/lib/promotions";
import { loadPosts } from "@/lib/store";
import { isExpired } from "@/lib/time";
import type { Post } from "@/lib/types";

type QuickTime = "all" | "today" | "24h" | "urgent";
type SortKey = "latest" | "deadline";

interface Selected {
  post: Post;
  rect: DOMRect | null;
  tier?: "main" | "rotation" | "category_top";
  premiumEndAt?: string;
}

const defaultFilters: FilterState = {
  publishTime: "all",
  deadline: "all",
  grade: "all",
};

const PAGE_SIZE = 9;

const quickOptions: { key: QuickTime; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "today", label: "今天新发" },
  { key: "24h", label: "24 小时内截止" },
  { key: "urgent", label: "🚨 急找" },
];

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState("all");
  const [tagId, setTagId] = useState("all");
  const [quick, setQuick] = useState<QuickTime>("all");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sort, setSort] = useState<SortKey>("latest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
  const listRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setPosts(loadPosts());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const timer = window.setTimeout(() => {
      track("search", { length: query.trim().length });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [query]);

  const categoryTopPosts = useMemo(() => {
    const list = getCategoryTopPromotions(groupId, tagId);
    return list
      .map((promotion) =>
        posts.find((post) => post.id === promotion.postId),
      )
      .filter(
        (post): post is Post =>
          Boolean(post) && !isExpired(post!.displayEndAt),
      );
  }, [posts, groupId, tagId]);

  const visiblePosts = useMemo(() => {
    const now = Date.now();
    const keyword = query.trim().toLowerCase();
    const promotedNow = new Set(categoryTopPosts.map((post) => post.id));

    const list = posts.filter((post) => {
      if (isExpired(post.displayEndAt, now)) {
        return false;
      }

      if (
        post.moderationStatus === "pending" ||
        post.moderationStatus === "rejected"
      ) {
        return false;
      }

      if (promotedNow.has(post.id)) {
        return false;
      }

      if (tagId !== "all" && post.type !== tagId) {
        return false;
      }

      if (groupId !== "all") {
        const postGroupId =
          post.type === "custom" ? "custom" : getTag(post.type).groupId;
        if (postGroupId !== groupId) {
          return false;
        }
      }

      const start = new Date(post.displayStartAt).getTime();
      const end = new Date(post.displayEndAt).getTime();

      if (quick === "today" && now - start > 86400000) {
        return false;
      }
      if ((quick === "24h" || quick === "urgent") && end - now > 86400000) {
        return false;
      }

      if (filters.publishTime !== "all") {
        const max =
          filters.publishTime === "today"
            ? 86400000
            : filters.publishTime === "3d"
              ? 3 * 86400000
              : 7 * 86400000;
        if (now - start > max) {
          return false;
        }
      }

      if (filters.deadline !== "all") {
        const max = filters.deadline === "24h" ? 86400000 : 3 * 86400000;
        if (end - now > max) {
          return false;
        }
      }

      if (filters.grade !== "all") {
        const text = `${post.gradePreference ?? ""} ${post.authorGrade}`;
        if (!text.includes(filters.grade) && !text.includes("不限")) {
          return false;
        }
      }

      if (!keyword) {
        return true;
      }

      const tag = post.type === "custom" ? null : getTag(post.type);
      const haystack = [
        post.title,
        post.description,
        post.customTag ?? "",
        ...post.skills,
        ...(tag ? [tag.label, ...tag.synonyms] : []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });

    list.sort((left, right) =>
      sort === "deadline"
        ? new Date(left.displayEndAt).getTime() -
          new Date(right.displayEndAt).getTime()
        : new Date(right.displayStartAt).getTime() -
          new Date(left.displayStartAt).getTime(),
    );

    return list;
  }, [posts, query, groupId, tagId, quick, filters, sort, categoryTopPosts]);

  const secondRowTags = useMemo(() => {
    if (groupId === "all") {
      return hotTagIds.map(getTag);
    }
    if (groupId === "custom") {
      return [getTag("custom")];
    }
    return getTagsByGroup(groupId);
  }, [groupId]);

  const totalPages = Math.max(1, Math.ceil(visiblePosts.length / PAGE_SIZE));
  const pagedPosts = visiblePosts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [query, groupId, tagId, quick, filters, sort]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  function goToPage(next: number) {
    const clamped = Math.min(Math.max(next, 1), totalPages);
    if (clamped !== page) {
      track("pagination_click", { page: clamped, totalPages });
    }
    setPage(clamped);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const advancedCount = [
    filters.publishTime,
    filters.deadline,
    filters.grade,
  ].filter((value) => value !== "all").length;

  function handleOpenFeatured(item: FeaturedItem, rect: DOMRect) {
    const post = posts.find((entry) => entry.id === item.postId);
    if (post) {
      setSelected({
        post,
        rect,
        tier: "rotation",
        premiumEndAt: item.endAt,
      });
    }
  }

  return (
    <main className="animate-fade-up flex flex-col pt-5 md:pt-8">
      <FeaturedCarousel onOpen={handleOpenFeatured} />

      <div className="mt-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索标签、技能或需求关键词"
          className="w-full rounded-2xl border border-white/70 bg-[#fffdfa]/95 px-4 py-3 text-sm shadow-sm outline-none placeholder:text-[#9aa7a0] focus:border-indigo-400"
        />
      </div>

      <ScrollRow className="mt-4 cursor-grab active:cursor-grabbing">
        <button
          type="button"
          onClick={() => {
            setGroupId("all");
            setTagId("all");
          }}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition duration-200 active:scale-95 ${
            groupId === "all"
              ? "bg-slate-900 text-white"
              : "bg-[#fffdfa] text-[#5c6b62] shadow-sm"
          }`}
        >
          全部
        </button>
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => {
              setGroupId(group.id);
              setTagId("all");
            }}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition duration-200 active:scale-95 ${
              groupId === group.id
                ? "bg-slate-900 text-white"
                : "bg-[#fffdfa] text-[#5c6b62] shadow-sm"
            }`}
          >
            {group.emoji} {group.label}
          </button>
        ))}
      </ScrollRow>

      <ScrollRow className="mt-2 cursor-grab active:cursor-grabbing">
        {quickOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => {
              setQuick(option.key);
              if (option.key === "24h" || option.key === "urgent") {
                setSort("deadline");
              }
              if (option.key === "today") {
                setSort("latest");
              }
            }}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition duration-200 active:scale-95 ${
              quick === option.key
                ? "bg-indigo-600 text-white"
                : "bg-[#fffdfa] text-[#5c6b62] shadow-sm"
            }`}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="relative shrink-0 rounded-full bg-[#fffdfa] px-3.5 py-1.5 text-xs font-medium text-[#5c6b62] shadow-sm transition active:scale-95"
        >
          筛选
          {advancedCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">
              {advancedCount}
            </span>
          ) : null}
        </button>
      </ScrollRow>

      <ScrollRow className="mt-2 cursor-grab active:cursor-grabbing">
        <button
          type="button"
          onClick={() => setTagId("all")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] transition duration-200 active:scale-95 ${
            tagId === "all"
              ? "bg-slate-900 text-white"
              : "bg-[#fffdfa]/80 text-[#7b8a80] shadow-sm"
          }`}
        >
          全部
        </button>
        {secondRowTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => setTagId(tag.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] transition duration-200 active:scale-95 ${
              tagId === tag.id
                ? "bg-slate-900 text-white"
                : "bg-[#fffdfa]/80 text-[#7b8a80] shadow-sm"
            }`}
          >
            {tag.emoji} {tag.label}
          </button>
        ))}
      </ScrollRow>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[#9aa7a0]">
        <span>
          共 {visiblePosts.length} 条需求 · 第 {page} / {totalPages} 页
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSort("latest")}
            className={`rounded-full px-3 py-1 transition ${
              sort === "latest"
                ? "bg-slate-900 text-white"
                : "bg-[#fffdfa] text-[#7b8a80]"
            }`}
          >
            最新发布
          </button>
          <button
            type="button"
            onClick={() => setSort("deadline")}
            className={`rounded-full px-3 py-1 transition ${
              sort === "deadline"
                ? "bg-slate-900 text-white"
                : "bg-[#fffdfa] text-[#7b8a80]"
            }`}
          >
            即将截止
          </button>
        </div>
      </div>

      {advancedCount > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {filters.publishTime !== "all" ? (
            <button
              type="button"
              onClick={() =>
                setFilters({ ...filters, publishTime: "all" })
              }
              className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] text-indigo-600"
            >
              发布时间：
              {filters.publishTime === "today"
                ? "今天"
                : filters.publishTime === "3d"
                  ? "3 天内"
                  : "7 天内"}{" "}
              ✕
            </button>
          ) : null}
          {filters.deadline !== "all" ? (
            <button
              type="button"
              onClick={() => setFilters({ ...filters, deadline: "all" })}
              className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] text-indigo-600"
            >
              截止：
              {filters.deadline === "24h" ? "24 小时内" : "3 天内"} ✕
            </button>
          ) : null}
          {filters.grade !== "all" ? (
            <button
              type="button"
              onClick={() => setFilters({ ...filters, grade: "all" })}
              className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] text-indigo-600"
            >
              年级：{filters.grade} ✕
            </button>
          ) : null}
        </div>
      ) : null}

      {categoryTopPosts.length > 0 ? (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-700">
            📌 本类置顶推广
            <span className="text-[11px] font-normal text-[#9aa7a0]">
              按曝光时长排序
            </span>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categoryTopPosts.map((post) => (
              <PostCard
                key={`top-${post.id}`}
                post={post}
                promotionLabel="📌 置顶推广"
                onClick={(item, rect) =>
                  setSelected({ post: item, rect, tier: "category_top" })
                }
              />
            ))}
          </div>
        </div>
      ) : null}

      <section
        ref={listRef}
        className="mt-4 grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {!loaded ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="h-44 animate-pulse rounded-3xl border border-white/60 bg-[#fffdfa]/60"
            />
          ))
        ) : visiblePosts.length === 0 ? (
          <div className="card-soft rounded-3xl p-8 text-center text-sm text-[#7b8a80] sm:col-span-2 xl:col-span-3">
            没有找到相关需求，换个标签、时间或关键词试试。
          </div>
        ) : (
          pagedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onClick={(item, rect) => setSelected({ post: item, rect })}
            />
          ))
        )}
      </section>

      <Pagination page={page} totalPages={totalPages} onChange={goToPage} />

      {filterOpen ? (
        <FilterSheet
          value={filters}
          onChange={setFilters}
          onClose={() => setFilterOpen(false)}
        />
      ) : null}

      {selected ? (
        <PostModal
          post={selected.post}
          originRect={selected.rect}
          tier={selected.tier}
          premiumEndAt={selected.premiumEndAt}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </main>
  );
}
