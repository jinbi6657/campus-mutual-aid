"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pagination } from "@/components/Pagination";
import { ScrollRow } from "@/components/ScrollRow";
import {
  clearAnalyticsEvents,
  loadAnalyticsEvents,
  summarizeEvents,
} from "@/lib/analytics";
import {
  addAuditLog,
  demoHash,
  findUser,
  generateInitialPassword,
  loadAuditLogs,
  loadHandledReports,
  loadSession,
  loadUsers,
  loadVerificationRequests,
  markReportHandled,
  resetPassword,
  saveUsers,
  setUserStatus,
  updateVerificationRequest,
} from "@/lib/auth";
import {
  loadCommunityPosts,
  loadCommunityReports,
  loadPosts,
  loadReports,
  updatePostModeration,
  updateCommunityPostStatus,
} from "@/lib/store";
import { addNotification } from "@/lib/notifications";
import type { CommunityPost, Post } from "@/lib/types";

type Section =
  | "dashboard"
  | "analytics"
  | "verifications"
  | "users"
  | "content"
  | "reports"
  | "audit";

const sections: { id: Section; label: string; emoji: string }[] = [
  { id: "dashboard", label: "数据看板", emoji: "📊" },
  { id: "analytics", label: "数据埋点", emoji: "📈" },
  { id: "verifications", label: "注册审核", emoji: "🪪" },
  { id: "users", label: "用户管理", emoji: "👥" },
  { id: "content", label: "内容审核", emoji: "📝" },
  { id: "reports", label: "举报处理", emoji: "🚨" },
  { id: "audit", label: "操作日志", emoji: "🧾" },
];

interface AdminReport {
  id: string;
  postId: string;
  reason: string;
  createdAt: string;
  source: "互助" | "校园圈";
  reporterId?: string;
}

export default function AdminPage() {
  const [section, setSection] = useState<Section>("dashboard");
  const [users, setUsers] = useState(loadUsers);
  const [requests, setRequests] = useState(loadVerificationRequests);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [mutualPending, setMutualPending] = useState<Post[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [handled, setHandled] = useState<string[]>([]);
  const [logs, setLogs] = useState(loadAuditLogs);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [analyticsVersion, setAnalyticsVersion] = useState(0);

  const actor = useMemo(() => {
    const session = loadSession();
    return session ? findUser(session.studentId)?.name ?? "管理员" : "管理员";
  }, []);

  function reload() {
    setUsers(loadUsers());
    setRequests(loadVerificationRequests());
    setPosts(loadCommunityPosts());
    setMutualPending(
      loadPosts().filter((post) => post.moderationStatus === "pending"),
    );
    setReports([
      ...loadReports().map((report) => ({
        id: `mutual-${report.postId}-${report.createdAt}`,
        postId: report.postId,
        reason: report.reason,
        createdAt: report.createdAt,
        source: "互助" as const,
        reporterId: report.reporterId,
      })),
      ...loadCommunityReports().map((report) => ({
        id: report.id,
        postId: report.postId,
        reason: report.reason,
        createdAt: report.createdAt,
        source: "校园圈" as const,
        reporterId: report.reporterId,
      })),
    ]);
    setHandled(loadHandledReports());
    setLogs(loadAuditLogs());
  }

  useEffect(() => {
    reload();
  }, []);

  const pendingRequests = requests.filter(
    (request) => request.status === "pending",
  );
  const pendingPosts = posts.filter((post) => post.status === "pending");
  const openReports = reports.filter(
    (report) => !handled.includes(report.id),
  );

  function approveRequest(id: string) {
    const request = requests.find((item) => item.id === id);
    if (!request) {
      return;
    }
    const initial = generateInitialPassword();
    updateVerificationRequest(id, {
      status: "approved",
      reviewedAt: new Date().toISOString(),
      initialPassword: initial,
    });
    if (!users.some((user) => user.studentId === request.studentId)) {
      saveUsers([
        ...users,
        {
          id: request.studentId,
          studentId: request.studentId,
          name: request.name,
          major: request.major,
          className: request.className,
          college: request.college,
          contact: request.contact,
          passwordHash: demoHash(initial),
          role: "student",
          status: "active",
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    addAuditLog(actor, "通过注册审核", request.studentId, "生成账号与初始密码");
    addNotification({
      userId: request.studentId,
      type: "verification",
      title: "注册申请已通过",
      content: `你的校园账号已创建，初始密码：${initial}。首次登录后请立即修改密码。`,
    });
    setMessage(`已通过 ${request.studentId}，初始密码：${initial}`);
    reload();
  }

  function rejectRequest(id: string) {
    const request = requests.find((item) => item.id === id);
    if (!request) {
      return;
    }
    updateVerificationRequest(id, {
      status: "rejected",
      reviewedAt: new Date().toISOString(),
      rejectReason: rejectReason || "信息与学籍名单不匹配",
    });
    addAuditLog(
      actor,
      "驳回注册审核",
      request.studentId,
      rejectReason || "信息与学籍名单不匹配",
    );
    setRejectReason("");
    setMessage(`已驳回 ${request.studentId}`);
    reload();
  }

  function handleResetPassword(studentId: string) {
    const initial = resetPassword(studentId);
    if (!initial) {
      return;
    }
    addAuditLog(actor, "重置密码", studentId, "生成新的初始密码");
    setMessage(`已重置 ${studentId} 的密码，新初始密码：${initial}`);
    reload();
  }

  function handleToggleUser(studentId: string, status: "active" | "disabled") {
    setUserStatus(studentId, status);
    addAuditLog(
      actor,
      status === "disabled" ? "禁用账号" : "启用账号",
      studentId,
      "",
    );
    setMessage(`${studentId} 已${status === "disabled" ? "禁用" : "启用"}`);
    reload();
  }

  function handlePostStatus(id: string, status: "approved" | "rejected") {
    updateCommunityPostStatus(id, status);
    addAuditLog(
      actor,
      status === "approved" ? "通过内容" : "驳回内容",
      id,
      "",
    );
    setMessage(status === "approved" ? "内容已通过" : "内容已驳回");
    reload();
  }

  function handleMutualStatus(id: string, status: "approved" | "rejected") {
    updatePostModeration(id, status);
    addAuditLog(
      actor,
      status === "approved" ? "通过互助帖" : "驳回互助帖",
      id,
      "",
    );
    setMessage(status === "approved" ? "互助帖已通过" : "互助帖已驳回");
    reload();
  }

  function handleReport(id: string) {
    markReportHandled(id);
    addAuditLog(actor, "处理举报", id, "标记已处理");
    const report = reports.find((item) => item.id === id);
    if (report?.reporterId) {
      addNotification({
        userId: report.reporterId,
        type: "report",
        title: "举报处理结果",
        content: `你举报的内容已处理（${report.reason}）。感谢你的反馈。`,
      });
    }
    setMessage("举报已标记处理");
    reload();
  }

  const filteredUsers = users.filter((user) =>
    search.trim()
      ? `${user.studentId} ${user.name} ${user.major} ${user.className}`.includes(
          search.trim(),
        )
      : true,
  );

  const filteredReports = reports.filter((report) =>
    reportSearch.trim()
      ? `${report.reason} ${report.source} ${report.postId}`.includes(
          reportSearch.trim(),
        )
      : true,
  );

  const filteredLogs = logs.filter((log) =>
    auditSearch.trim()
      ? `${log.actor} ${log.action} ${log.target} ${log.detail}`.includes(
          auditSearch.trim(),
        )
      : true,
  );

  const pageSize = 10;
  const pagedUsers = filteredUsers.slice(
    (userPage - 1) * pageSize,
    userPage * pageSize,
  );
  const pagedReports = filteredReports.slice(
    (reportPage - 1) * pageSize,
    reportPage * pageSize,
  );
  const pagedLogs = filteredLogs.slice((auditPage - 1) * 20, auditPage * 20);

  useEffect(() => {
    setUserPage(1);
  }, [search]);

  useEffect(() => {
    setReportPage(1);
  }, [reportSearch]);

  useEffect(() => {
    setAuditPage(1);
  }, [auditSearch]);

  const analytics = summarizeEvents(loadAnalyticsEvents());

  function renderSectionButton(item: (typeof sections)[number]) {
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setSection(item.id)}
        className={`shrink-0 rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
          section === item.id
            ? "bg-slate-900 text-white"
            : "text-[#5c6b62] hover:bg-white/70"
        }`}
      >
        {item.emoji} {item.label}
        {item.id === "verifications" && pendingRequests.length > 0
          ? ` (${pendingRequests.length})`
          : ""}
        {item.id === "content" &&
        pendingPosts.length + mutualPending.length > 0
          ? ` (${pendingPosts.length + mutualPending.length})`
          : ""}
        {item.id === "reports" && openReports.length > 0
          ? ` (${openReports.length})`
          : ""}
      </button>
    );
  }

  return (
    <main className="flex flex-col pt-6 lg:flex-row lg:gap-6">
      <aside className="lg:w-56 lg:shrink-0">
        <div className="glass rounded-3xl p-4">
          <p className="px-2 text-xs font-semibold text-[#7b8a80]">
            管理后台 · 演示版
          </p>
          <div className="lg:hidden">
            <ScrollRow className="mt-2 cursor-grab active:cursor-grabbing">
              {sections.map(renderSectionButton)}
            </ScrollRow>
          </div>
          <nav className="mt-2 hidden lg:flex lg:flex-col">
            {sections.map(renderSectionButton)}
          </nav>
        </div>
      </aside>

      <section className="mt-4 flex-1 lg:mt-0">
        {message ? (
          <p className="mb-3 rounded-2xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            {message}
          </p>
        ) : null}

        {section === "dashboard" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
              { label: "注册用户", value: users.length },
              { label: "待审核申请", value: pendingRequests.length },
              {
                label: "待审核内容",
                value: pendingPosts.length + mutualPending.length,
              },
              { label: "待处理举报", value: openReports.length },
              { label: "校园圈内容", value: posts.length },
              { label: "操作日志", value: logs.length },
              ].map((card) => (
                <div key={card.label} className="card-soft rounded-3xl p-5">
                  <p className="text-xs text-[#7b8a80]">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/eval"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-500 px-4 py-3 text-xs font-semibold text-white shadow-md shadow-indigo-200"
            >
              🧪 进入 AI 评测中心（规则 vs AI 对比）
            </Link>
          </>
        ) : null}

        {section === "analytics" ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="card-soft rounded-3xl p-5">
                <p className="text-xs text-[#7b8a80]">事件总数</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {analytics.total}
                </p>
              </div>
              <div className="card-soft rounded-3xl p-5">
                <p className="text-xs text-[#7b8a80]">今日事件</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {analytics.today}
                </p>
              </div>
              <div className="card-soft rounded-3xl p-5">
                <p className="text-xs text-[#7b8a80]">事件类型</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {analytics.byName.length}
                </p>
              </div>
            </div>

            <div className="card-soft rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  事件分布
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    clearAnalyticsEvents();
                    setAnalyticsVersion((value) => value + 1);
                    setMessage("本地埋点数据已清空");
                  }}
                  className="text-[11px] text-[#9aa7a0]"
                >
                  清空本地数据
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {analytics.byName.map((item) => {
                  const max = analytics.byName[0]?.count || 1;
                  return (
                    <div key={item.event}>
                      <div className="flex items-center justify-between text-[11px] text-[#5c6b62]">
                        <span>{item.event}</span>
                        <span>{item.count}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#f2f5ef]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                          style={{
                            width: `${Math.round((item.count / max) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {analytics.byName.length === 0 ? (
                  <p className="text-xs text-[#9aa7a0]">还没有事件。</p>
                ) : null}
              </div>
            </div>

            <div className="card-soft rounded-3xl p-5">
              <h2 className="text-sm font-semibold text-slate-900">
                最近事件（演示版仅本机可见）
              </h2>
              <div className="mt-3 space-y-1">
                {analytics.recent.slice(0, 20).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-xl bg-[#f7f8f4] px-3 py-2 text-[11px] text-[#5c6b62]"
                  >
                    <span>
                      <span className="font-medium">{event.event}</span>
                      <span className="ml-2 text-[#9aa7a0]">
                        {event.page}
                      </span>
                    </span>
                    <span className="text-[#9aa7a0]">
                      {new Date(event.time).toLocaleTimeString("zh-CN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {section === "verifications" ? (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="card-soft rounded-3xl p-6 text-center text-sm text-[#7b8a80]">
                还没有注册申请。
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="card-soft rounded-3xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {request.name} · {request.studentId}
                      </p>
                      <p className="mt-1 text-xs text-[#7b8a80]">
                        {request.major} · {request.className}
                        {request.college ? ` · ${request.college}` : ""}
                      </p>
                      <p className="mt-1 text-[11px] text-[#9aa7a0]">
                        联系方式：{request.contact}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] ${
                        request.status === "approved"
                          ? "bg-emerald-50 text-emerald-600"
                          : request.status === "rejected"
                            ? "bg-rose-50 text-rose-600"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {request.status === "approved"
                        ? "已通过"
                        : request.status === "rejected"
                          ? "已驳回"
                          : request.autoMatched
                            ? "自动比对通过，待确认"
                            : "待人工复核"}
                    </span>
                  </div>
                  {request.status === "pending" ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => approveRequest(request.id)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white"
                      >
                        通过并生成账号
                      </button>
                      <input
                        value={rejectReason}
                        onChange={(event) => setRejectReason(event.target.value)}
                        placeholder="驳回理由（选填）"
                        className="flex-1 rounded-xl border border-[#e8ece5] bg-[#fffdfa] px-3 py-2 text-xs outline-none focus:border-indigo-400"
                      />
                      <button
                        type="button"
                        onClick={() => rejectRequest(request.id)}
                        className="rounded-xl bg-[#f2f5ef] px-4 py-2 text-xs text-[#7b8a80]"
                      >
                        驳回
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        ) : null}

        {section === "users" ? (
          <div className="space-y-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索学号 / 姓名 / 专业 / 班级"
              className="w-full rounded-2xl border border-white/70 bg-[#fffdfa]/95 px-4 py-3 text-sm shadow-sm outline-none focus:border-indigo-400"
            />
            {pagedUsers.map((user) => (
              <div
                key={user.studentId}
                className="card-soft flex flex-wrap items-center justify-between gap-3 rounded-3xl p-4"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {user.name} · {user.studentId}
                  </p>
                  <p className="mt-0.5 text-xs text-[#7b8a80]">
                    {user.major} · {user.className} ·{" "}
                    {user.role === "admin" ? "管理员" : "学生"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] ${
                      user.status === "active"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {user.status === "active" ? "正常" : "已禁用"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleResetPassword(user.studentId)}
                    className="rounded-xl bg-[#f2f5ef] px-3 py-1.5 text-[11px] text-[#5c6b62]"
                  >
                    重置密码
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleUser(
                        user.studentId,
                        user.status === "active" ? "disabled" : "active",
                      )
                    }
                    className="rounded-xl bg-[#f2f5ef] px-3 py-1.5 text-[11px] text-[#5c6b62]"
                  >
                    {user.status === "active" ? "禁用" : "启用"}
                  </button>
                </div>
              </div>
            ))}
            <Pagination
              page={userPage}
              totalPages={Math.max(1, Math.ceil(filteredUsers.length / 10))}
              onChange={setUserPage}
            />
          </div>
        ) : null}

        {section === "content" ? (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">
              互助需求待审核（{mutualPending.length}）
            </h2>
            {mutualPending.length === 0 ? (
              <div className="card-soft rounded-3xl p-5 text-center text-xs text-[#9aa7a0]">
                当前没有待审核的互助需求。
              </div>
            ) : (
              mutualPending.map((post) => (
                <div key={post.id} className="card-soft rounded-3xl p-5">
                  <p className="text-xs text-[#9aa7a0]">
                    {post.authorName} · {post.authorMajor}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {post.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#5c6b62]">
                    {post.description}
                  </p>
                  {post.moderationReasons?.length ? (
                    <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                      预审原因：{post.moderationReasons.join("；")}
                    </p>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleMutualStatus(post.id, "approved")}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white"
                    >
                      通过
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMutualStatus(post.id, "rejected")}
                      className="rounded-xl bg-[#f2f5ef] px-4 py-2 text-xs text-[#7b8a80]"
                    >
                      驳回
                    </button>
                  </div>
                </div>
              ))
            )}

            <h2 className="pt-2 text-sm font-semibold text-slate-900">
              校园圈待审核（{pendingPosts.length}）
            </h2>
            {pendingPosts.length === 0 ? (
              <div className="card-soft rounded-3xl p-6 text-center text-sm text-[#7b8a80]">
                当前没有待审核内容。
              </div>
            ) : (
              pendingPosts.map((post) => (
                <div key={post.id} className="card-soft rounded-3xl p-5">
                  <p className="text-xs text-[#9aa7a0]">
                    {post.anonymous ? "匿名同学" : post.author}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#3e4c59]">
                    {post.content}
                  </p>
                  {post.moderationReasons.length > 0 ? (
                    <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                      AI 预审原因：{post.moderationReasons.join("；")}
                    </p>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePostStatus(post.id, "approved")}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white"
                    >
                      通过
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePostStatus(post.id, "rejected")}
                      className="rounded-xl bg-[#f2f5ef] px-4 py-2 text-xs text-[#7b8a80]"
                    >
                      驳回
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}

        {section === "reports" ? (
          <div className="space-y-3">
            <input
              value={reportSearch}
              onChange={(event) => setReportSearch(event.target.value)}
              placeholder="搜索举报原因 / 来源 / 对象"
              className="w-full rounded-2xl border border-white/70 bg-[#fffdfa]/95 px-4 py-3 text-sm shadow-sm outline-none focus:border-indigo-400"
            />
            {reports.length === 0 ? (
              <div className="card-soft rounded-3xl p-6 text-center text-sm text-[#7b8a80]">
                当前没有举报。
              </div>
            ) : (
              pagedReports.map((report) => {
                const isHandled = handled.includes(report.id);
                return (
                  <div
                    key={report.id}
                    className="card-soft flex flex-wrap items-center justify-between gap-3 rounded-3xl p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        [{report.source}] {report.reason}
                      </p>
                      <p className="mt-0.5 text-xs text-[#7b8a80]">
                        对象：{report.postId} ·{" "}
                        {new Date(report.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    {isHandled ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-600">
                        已处理
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReport(report.id)}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white"
                      >
                        标记已处理
                      </button>
                    )}
                  </div>
                );
              })
            )}
            <Pagination
              page={reportPage}
              totalPages={Math.max(1, Math.ceil(filteredReports.length / 10))}
              onChange={setReportPage}
            />
          </div>
        ) : null}

        {section === "audit" ? (
          <div className="space-y-2">
            <input
              value={auditSearch}
              onChange={(event) => setAuditSearch(event.target.value)}
              placeholder="搜索操作人 / 动作 / 对象"
              className="w-full rounded-2xl border border-white/70 bg-[#fffdfa]/95 px-4 py-3 text-sm shadow-sm outline-none focus:border-indigo-400"
            />
            {logs.length === 0 ? (
              <div className="card-soft rounded-3xl p-6 text-center text-sm text-[#7b8a80]">
                还没有操作记录。
              </div>
            ) : (
              pagedLogs.map((log) => (
                <div
                  key={log.id}
                  className="card-soft rounded-2xl px-4 py-3 text-xs text-[#5c6b62]"
                >
                  <span className="font-medium text-slate-900">
                    {log.actor}
                  </span>{" "}
                  {log.action} · {log.target}
                  {log.detail ? ` · ${log.detail}` : ""}
                  <span className="ml-2 text-[#9aa7a0]">
                    {new Date(log.createdAt).toLocaleString("zh-CN")}
                  </span>
                </div>
              ))
            )}
            <Pagination
              page={auditPage}
              totalPages={Math.max(1, Math.ceil(filteredLogs.length / 20))}
              onChange={setAuditPage}
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
