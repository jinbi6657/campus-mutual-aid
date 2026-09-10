import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许通过环境变量指定构建目录，避免开发服务器与构建互相覆盖
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
