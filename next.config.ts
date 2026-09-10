import type { NextConfig } from "next";

// Cloudflare Pages 只能托管纯静态站点：构建时把前端导出成静态文件。
// 本地开发、以及将来跑在 Node 容器上时，这个开关默认关闭，行为完全不变。
const staticExport =
  process.env.NEXT_STATIC_EXPORT === "1" || process.env.CF_PAGES === "1";

const nextConfig: NextConfig = {
  // 允许通过环境变量指定构建目录，避免开发服务器与构建互相覆盖
  distDir: process.env.NEXT_DIST_DIR || ".next",
  ...(staticExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
