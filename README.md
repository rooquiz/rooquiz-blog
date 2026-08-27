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
              # （只在本地回落；CI / Vercel 里缺凭据会直接让构建失败）
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

## 视觉设计

版式完全参照 `docs/5bb4eb118bb50.mp4`（一支 918×656、4 秒的录屏）。几何量是逐帧
量出来的，写在 `src/styles/tokens.css`，推导写在 `src/styles/stage.css` 的注释里：

| 元素       | 原稿                | token                   |
| ---------- | ------------------- | ----------------------- |
| 竖发丝线   | x = 178             | `--rail-w: 19.4%`       |
| 影像窗口   | y = 114…544         | `--band-t` / `--band-h` |
| 中央预览卡 | 75…355 × 220…447    | `--card-l` / `--card-w` |
| 文字栏     | 起 427，宽 240      | `--col-l` / `--col-w`   |
| 条目高度   | 430（横发丝线间距） | `--entry-h: 65.5vh`     |

三层以不同速度滚动：影像带跟文档走（每格 65.5vh，首尾相接，看起来是一条胶片），
预览卡钉在视口中心并在条目交接处换图，文字栏比影像带慢、整栏朝中心收拢。

**字体**：展示字体 Anybody（wdth 125 / wght 800）—— 原稿的日期大标题是 Eurostile
Bold Extended 那一路的方形宽体，Google Fonts 里只有 Anybody 的字形对得上，而且它带
`wdth` 可变轴，宽度是选出来的而不是横向拉伸出来的。正文 Space Grotesk 300 —— 原稿
正文那个平顶的「3」和双层「a」就是它。两款都没有中日韩字形，所以中文的日期戳走
`2026.08.27` 而不是「2026年8月27日」（见 `lib/format.ts` 的 `formatStamp`），
否则一个大字号里会混进两套字重两套宽度。

**主色取的是原稿的洋红 `#e4008c`**（视频里饱和度最高的像素在 `#e50389`–`#de0088`
一带），不是 rooquiz 原来的品牌紫。要换回紫色只需改 `tokens.css` 里 `--accent`
一行 —— 其余全站都引这个变量。

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
- **CI 里缺 Supabase 凭据直接让构建失败**，而不是回落到样例内容。回落对本地是便利，
  对生产是灾难：构建照样绿灯，产出的却是一个只有样例文章的站，没有任何一处会报错。
  这个失败模式真实发生过一次，守卫在 `scripts/sync-content.mts` 的 `isAutomatedBuild()`。
- **搜索走构建期 JSON 索引 + 客户端 MiniSearch**，不走 Postgres 全文检索：
  Supabase 的托管 Postgres 没有中文分词扩展，`to_tsvector` 对中文等于整段不切。
  `posts.search_vector` 那列留着，文章上千后可切回服务端。
- **列表页的视差 / 卡片切换 / 上下步进控件全部是 CSS，没有一行 JS**：条目用
  `view-timeline-name` 声明自己的滚动时间线，卡片与文字作为它的后代用
  `animation-timeline` 取到那条时间线。卡片不是 `position: fixed`，而是绝对定位在
  条目中心、再用一条线性 `translate` 抵消条目自身的位移 —— 等效于钉在视口中心，
  但不依赖「fixed 后代能否解析祖先时间线」这个更冷的行为。步进按钮是纯 `#anchor`，
  靠 `scroll-margin` 落位到视口中心。不支持滚动驱动动画的浏览器走
  `@supports` 兜底：卡片静静躺在各自条目的中心，版式还在，只是不动。
- **滚动驱动动画必须写 longhand 并显式给 `animation-duration: auto`**，不能用
  `animation: x linear both` 简写。简写省略时长拿到的是初始值 `auto`（css-animations-2
  为滚动驱动动画专门从 `0s` 改成了 `auto`），dev 下正常；但生产构建里 Tailwind v4 的
  Lightning CSS 会把简写展开成 longhand 并把时长写成 `0s`，动画活动时长归零、进度
  永远停在 0%，于是所有卡片 `visibility: hidden` —— 中央预览卡在生产环境里整个消失，
  而 `pnpm dev` 完全看不出来。这个坑踩过一次，守卫是 `stage.css` 里那段注释。
- **`--entry-h` 之外的交接百分比是硬编码的**（30.2% / 69.8% 那一组）：它们由
  `entry-h / (100vh + entry-h)` 推出来，CSS 里没法从变量算出关键帧百分比。
  改 `--entry-h` 就要跟着重算，公式写在 `stage.css` 的注释里。
- **OG 图的两个字体文件提交进仓库**（`src/lib/og-fonts/`）：Satori 不读 CSS，
  必须拿到字体二进制，而 `next/font` 注入的是 CSS 变量。构建期去网上拉字体只会
  多一种「CI 里偶发失败」的方式，这两个文件一年也不会动一次。

## 依赖 pin

`pnpm-workspace.yaml` 里两个 `overrides` 不要删：

- `unified: ^11.0.5` —— `next-mdx-remote` 与 `@shikijs/rehype` 各拉一个 unified，
  两份 `Processor` 类型不互认，插件数组会整段类型报错。
- `style-to-js: ^2.0.0` —— 1.x 的 CJS 构建把函数挂在 `exports.default` 上，
  `hast-util-to-estree` 拿到的不是函数，于是 Shiki 高亮出来的每个 `<span style>`
  都会以 “Could not parse \`style\` attribute” 让构建失败。rooquiz-docs 踩过同一个坑。
