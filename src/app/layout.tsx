import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "搭友 · 校园互助组队与智能匹配平台",
  description: "找队友、找搭子、找互助，AI 帮你找到对的人。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// 首屏鉴权拦截。
// 登录态存在 localStorage 里，只能在浏览器里判断；如果等 React 水合后再跳转，
// 静态页面会先渲染出来再被替换成登录页，出现明显闪烁。
// 这段脚本在页面内容渲染之前同步执行，未登录直接换页，不会看到首页。
const AUTH_GUARD_SCRIPT = `
(function () {
  try {
    var path = window.location.pathname;
    if (path === "/login" || path === "/change-password") {
      return;
    }
    var raw = window.localStorage.getItem("campus-auth-session-v1");
    var session = raw ? JSON.parse(raw) : null;
    var valid = !!(session && session.studentId);
    if (valid && session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
      window.localStorage.removeItem("campus-auth-session-v1");
      valid = false;
    }
    if (!valid) {
      window.location.replace("/login");
      return;
    }
    var adminOnly = path === "/eval" || path.indexOf("/admin") === 0;
    if (adminOnly && session.role !== "admin") {
      window.location.replace("/");
    }
  } catch (error) {
    window.location.replace("/login");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <script
          id="auth-guard"
          dangerouslySetInnerHTML={{ __html: AUTH_GUARD_SCRIPT }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
