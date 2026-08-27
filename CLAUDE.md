代码中注释使用中文，其他都以英文为主，git commit message 使用英文
不要新建 git 分支

## 项目

RooQuiz 博客（`blog.rooquiz.com`）。MDX 正文在 Supabase Storage，元数据在 Supabase
Postgres，构建期固化成纯静态站部署到 Vercel。无后台，发布走 `/api/posts`。

架构与不显然的技术决定见 `README.md`；发布接口契约见 `docs/publishing-api.md`；
AI / n8n 接入指南见 `docs/automating-publishing.md`（改接口或校验规则时要同步更新它）。

## 命令

```bash
pnpm dev        # 端口 8200（组织内已占：berlin 8000 / cairo 8001 / dubai 8002 /
                #             topic-coaching 8100 / payload 6543）
pnpm sync       # 同步内容到 .content/，无 Supabase 变量时回落 content/_samples/
pnpm build      # pnpm sync && next build
pnpm typecheck
pnpm lint
```

## 改代码时注意

- **HeroUI v3 必须走 per-component 子路径**：`@heroui/react/card`，不是
  `@heroui/react`。barrel 在 Server Component 里会因 `client-only` 构建失败。
- **HeroUI 组件全是 `'use client'`**。正文（`components/mdx/`）、列表卡片、分页
  刻意不用它。要加交互组件，先想清楚这一屏是否值得多一份 react-aria。
- **内容页一律 `export const dynamic = 'force-static'`**，凡是列举得完的路由都要
  写 `generateStaticParams` + `dynamicParams = false`。新增页面后跑一次
  `pnpm build`，确认它在产物清单里是 `●`/`○` 而不是 `ƒ`。
- **站内路径统一用 `localePath()`**（`src/lib/content/index.ts`），别手拼字符串
  —— 丢了 locale 前缀就是 404。
- **Storage key 前缀只有一个来源**：`src/lib/content/paths.ts` 的
  `postObjectPath()` / `mediaObjectPrefix()`，签发端与读取端共用。
- **`src/lib/supabase/admin.ts` 带 `server-only`**，别在组件里 import。
- **`pnpm-workspace.yaml` 的两个 overrides 不要删**（unified / style-to-js），
  原因写在 README「依赖 pin」一节。
- **别把 `sync-content.mts` 里的 CI 守卫改回静默回落**。缺凭据时在 CI 中必须让构建
  失败——静默回落会产出「部署成功但内容是样例」的站，排查起来毫无线索。
- `src/app/[locale]/kitchen-sink/` 是 HeroUI 主题验证用的临时页，站点定型后删掉，
  同时从 `RESERVED_SLUGS` 和 `robots.ts` 的 disallow 里摘掉。
