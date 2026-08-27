# rooquiz-blog

RooQuiz 博客 —— `blog.rooquiz.com`。

MDX 正文存 Supabase Storage，元数据存 Supabase Postgres，Vercel 在构建期把两者
固化成纯静态站。没有后台界面：文章一律通过受 token 保护的 HTTP 接口写入
（接口契约见 [`docs/publishing-api.md`](docs/publishing-api.md)，
AI / n8n 接入见 [`docs/automating-publishing.md`](docs/automating-publishing.md)）。

## 架构

```
AI / n8n / 脚本
     │ POST /api/posts (Bearer token)
     ▼
Route Handler ── MDX ──▶ Supabase Storage (blog-content, private)
     │        └ 元数据 ─▶ Postgres posts 表
     │ Vercel Deploy Hook
     ▼
Vercel Build
     ├ pnpm sync   —— 拉索引 + 增量下载 MDX 到 .content/
     └ next build  —— 全站预渲染（含 OG PNG / sitemap / feed / 搜索索引）
     ▼
静态产物走 CDN，运行时零 Supabase 依赖
```

只有四个端点是动态的：`/api/posts`、`/api/deploy`、`/api/media/upload-url`、
`/api/views/[locale]/[slug]`。其余全部 `force-static`。

## 本地开发

```bash
pnpm install
pnpm sync     # 没配 Supabase 变量时回落到 content/_samples/，离线可用
pnpm dev      # http://localhost:8200
```

| 命令                        | 作用                                                        |
| --------------------------- | ----------------------------------------------------------- |
| `pnpm dev`                  | 开发服务器，端口 8200                                       |
| `pnpm sync`                 | 从 Supabase 同步内容到 `.content/`（`pnpm build` 会先跑它） |
| `pnpm build`                | `pnpm sync && next build`                                   |
| `pnpm typecheck`            | `tsc --noEmit`                                              |
| `pnpm lint` / `pnpm format` |                                                             |

`.content/` 与 `public/search-index-*.json` 都是同步产物，已 gitignore。

## 环境变量

见 `.env.example`。本地放 `.env.local`，生产在 Vercel 项目设置里配，
`SUPABASE_SERVICE_ROLE_KEY` / `BLOG_WRITE_TOKEN` / `VERCEL_DEPLOY_HOOK_URL`
三个要勾 Sensitive。

客户端不需要任何 Supabase 密钥 —— 所有访问都在服务端或构建期。

## Supabase

一个**独立** project（不与 `rooquiz-payload` 共库，避免和它那套 Drizzle 迁移互相干扰）。

- 表结构：把 `supabase/migrations/0001_init.sql` 整份贴进 SQL Editor 跑一次
- Storage：建两个 bucket
  - `blog-content` —— **private**，`posts/{locale}/{slug}.mdx`
  - `blog-media` —— **public**，`images/{translationKey}/{filename}`

## 内容约定

| 概念             | 说明                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------ |
| `slug`           | 小写字母 + 数字 + 单连字符，不能撞 `site.config.ts` 里的 `RESERVED_SLUGS`            |
| `translationKey` | 同一篇文章跨语言的分组键。缺失时中英文互不关联，不产出 hreflang                      |
| 路由             | `/{locale}/{slug}`，locale ∈ `en` \| `zh`，**英文为主**，`/` 按 Accept-Language 分流 |
| 站内链接         | MDX 里必须自带 locale 前缀（`/en/xxx`）。不自动补全 —— 补错比 404 更难查             |
| 图片             | 上传到 `blog-media` 后引用返回的 `publicUrl`，会走 `next/image` 优化                 |

## 部署

Vercel，region `iad1`（与 Vercel 默认构建区域、Supabase project 同区——
构建期的 `pnpm sync` 与运行时的 `/api/views` 都要连库，跨区会明显拖慢构建）。`blog.rooquiz.com` 的 CNAME 在 Cloudflare DNS 里必须
**DNS-only（灰云）**，走橙云会和 Vercel 的证书签发打架。

发布链路：写入 API → Deploy Hook → 构建 → CDN。

## 技术选型里几个不显然的决定

- **不用 `output: 'export'`**：静态导出没有 Route Handler，写入 API 就得外挂
  Supabase Edge Function（Deno，组织内无先例，两套代码两个部署）。现在的做法是
  内容页全部 `force-static`，只留四个 serverless 端点，service role key 因此
  永远留在服务端。
- **不用 Nextra**（docs 仓那套）：它的 `importPage` 强依赖构建期扫本地 `content/`，
  与「从 Storage 取源」不兼容。这里用 `next-mdx-remote/rsc` 的 `compileMDX`。
- **HeroUI v3 只用 per-component 子路径**（`@heroui/react/card`，不是
  `@heroui/react`）：barrel 的依赖图里有 `client-only`，在 Server Component 里
  直接构建失败。而且它的组件全是 `'use client'`，正文与列表刻意不用它，
  免得每页都拖一份 react-aria 进首屏。
- **分页自己写而不用 HeroUI 的 Pagination**：后者建立在 react-aria Button 上，
  只接受 `onPress` 不接受 `href`，渲染出来是按钮而非可爬取的 `<a>`。
- **搜索走构建期 JSON 索引 + 客户端 MiniSearch**，不走 Postgres 全文检索：
  Supabase 的托管 Postgres 没有中文分词扩展，`to_tsvector` 对中文等于整段不切。
  `posts.search_vector` 那列留着，文章上千后可切回服务端。

## 依赖 pin

`pnpm-workspace.yaml` 里两个 `overrides` 不要删：

- `unified: ^11.0.5` —— `next-mdx-remote` 与 `@shikijs/rehype` 各拉一个 unified，
  两份 `Processor` 类型不互认，插件数组会整段类型报错。
- `style-to-js: ^2.0.0` —— 1.x 的 CJS 构建把函数挂在 `exports.default` 上，
  `hast-util-to-estree` 拿到的不是函数，于是 Shiki 高亮出来的每个 `<span style>`
  都会以 “Could not parse \`style\` attribute” 让构建失败。rooquiz-docs 踩过同一个坑。
