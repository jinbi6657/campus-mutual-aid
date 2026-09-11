"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  clearSession,
  ensureSeedData,
  findUser,
  loadSession,
} from "@/lib/auth";
import { track } from "@/lib/analytics";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";
import { RiverBackground } from "./RiverBackground";
import { SiteHeader } from "./SiteHeader";
import { AnalyticsDebugPanel } from "./AnalyticsDebugPanel";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    ensureSeedData();
    const session = loadSession();
    const isPublic = pathname === "/login";
    const isChangePassword = pathname === "/change-password";

    if (
      session?.expiresAt &&
      new Date(session.expiresAt).getTime() < Date.now()
    ) {
      clearSession();
      router.replace("/login");
      return;
    }

    if (!session && !isPublic) {
      router.replace("/login");
      return;
    }

    if (session) {
      const user = findUser(session.studentId);
      if (!user) {
        router.replace("/login");
        return;
      }
      if (isPublic) {
        router.replace(user.role === "admin" ? "/admin" : "/");
        return;
      }
      if (user.mustChangePassword && !isChangePassword) {
        router.replace("/change-password");
        return;
      }
      if (!user.mustChangePassword && isChangePassword) {
        router.replace(user.role === "admin" ? "/admin" : "/");
        return;
      }
      // 管理端和评测中心都只允许管理员账号访问
      const adminOnly =
        pathname.startsWith("/admin") || pathname === "/eval";
      if (adminOnly && user.role !== "admin") {
        router.replace("/");
        return;
      }
    }

    track("page_view", { path: pathname });
  }, [pathname, router]);

  const isBare = pathname === "/login" || pathname === "/change-password";
  if (isBare) {
    return <>{children}</>;
  }

  return (
    <>
      <RiverBackground variant="subtle" />
      <MobileHeader />
      <SiteHeader />
      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-4 pb-24 sm:px-6 md:pb-14 lg:px-8">
        {children}
      </div>
      <AnalyticsDebugPanel />
      <BottomNav />
    </>
  );
}
