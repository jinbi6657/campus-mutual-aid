# 搭友 · Cloudflare Pages 部署指南

> 正式项目名：基于大模型的校园互助组队与智能匹配 Web 平台设计与实现

## 一、部署形态说明

Cloudflare Pages 只能托管**静态站点**，所以这个项目在 Cloudflare 上是这样跑的：

| 部分 | 形态 | 说明 |
|---|---|---|
| 前端页面 | 静态导出（`out/` 目录） | `NEXT_STATIC_EXPORT=1 next build` 生成 |
| AI 接口 | Pages Functions（`functions/` 目录） | 与 Next 路由同路径，前端代码不用改 |
| 业务数据 | 浏览器 localStorage | 每个访客数据独立 |

本地开发和将来部署到 Node 容器时，不设 `NEXT_STATIC_EXPORT` 就会退回原来的常规 Next.js 模式，行为不变。

## 二、部署前已在本地验证过的内容

- 常规构建通过（17 个路由）
- 静态导出通过，产物为 `out/`（12 个页面 + 404，不含 api 目录）
- Pages Functions 打包通过（`wrangler pages functions build` → Compiled Worker successfully）
- 在本地 Cloudflare 运行时（`wrangler pages dev`）实测：
  - `GET /` → 200
  - `GET /login` → 200
  - `GET /post?id=xxx` → 200
- `POST /api/ai/parse` → 200，真实调用 DeepSeek 成功
- `POST /api/ai/match` → 200，返回真实推荐结果
- `POST /api/ai/draft` → 200，返回真实生成文案
- `POST /api/ai/clarify` → 需求澄清（信息不足时返回最多 2 个可点选问题）
- `POST /api/ai/coach` → 需求质量教练（诊断 + 改写）

> 说明：五个接口都以同一路径提供两份实现——`src/app/api/**`（本地开发）与 `functions/api/**`（Cloudflare 线上），前端不需要区分。

## 三、部署步骤

### 1. 注册 Cloudflare

打开 https://dash.cloudflare.com/sign-up ，用邮箱注册即可（不需要实名、不需要银行卡）。

### 2. 连接 GitHub 仓库

1. 左侧选 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 授权 GitHub，选择仓库 `jinbi6657/campus-mutual-aid`
3. 分支选 `main`

### 3. 构建配置（关键，别填错）

| 字段 | 填什么 |
|---|---|
| Framework preset | Next.js (Static HTML Export) —— 选不了就选 None |
| Build command | `NEXT_STATIC_EXPORT=1 next build` |
| Build output directory | `out` |
| Root directory | 留空（仓库根目录） |

### 4. 环境变量（漏了 AI 就会降级成规则匹配）

在 **Environment variables** 里加两条，两条都要，Production 和 Preview 都勾上：

| 变量名 | 值 |
|---|---|
| `DEEPSEEK_API_KEY` | 你的 DeepSeek Key（打开项目里的 `.env.local` 复制） |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` |

### 5. 部署

点 **Save and Deploy**，等 1–2 分钟，拿到 `https://<项目名>.pages.dev`。

## 四、部署后自测清单

- [ ] 打开首页，登录页动态背景正常
- [ ] 用测试账号 `123123 / 123123` 登录，首次强制改密流程正常
- [ ] 首页广场大屏轮播、倒计时、卡片点击放大/飞回正常
- [ ] 点卡片 → 浮层 → 「查看详情」跳到 `/post?id=xxx` 能正常打开
- [ ] AI 智能匹配返回真实结果（**如果显示"AI 暂不可用/已切换规则匹配" → 环境变量没配好**）
- [ ] 发布需求时「AI 生成文案」能用
- [ ] `/eval` 评测页能跑（现在在浏览器里跑，10 题约 20–30 秒，50 题 1–2 分钟）
- [ ] 校园圈发帖、点赞、评论、举报正常
- [ ] 管理后台（admin / admin123）各列表分页搜索正常
- [ ] 手机端打开排版正常，并实测 4G 网络下的加载速度

## 五、注意事项

1. **公开链接会烧 AI 额度**。单次匹配约 ¥0.0026，`/eval` 一次 50 题。建议 DeepSeek 账户只放十几二十块，或给接口加频率限制。
2. **国内访问速度中等**。Cloudflare 免费版走海外节点，能打开但不快；要国内飞快需要 Cloudflare 企业版 + 域名备案。
3. **想要自定义域名**：Pages 项目 → Custom domains → 绑定自己的域名（免费，不需要备案，仍是海外节点）。
4. **每次 `git push` 会自动重新部署**，Pull Request 还会生成预览链接。

## 六、本地开发（和以前一样）

```bash
pnpm dev
```

本地走 Next.js 自带的路由（`src/app/api/**`），AI 接口照常可用，不受静态导出影响。

如果想在本地模拟 Cloudflare 环境：

```bash
NEXT_STATIC_EXPORT=1 next build
npx wrangler pages dev out
```
