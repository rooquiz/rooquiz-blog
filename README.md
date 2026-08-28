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

一片天 + 一道彩虹拱门 + 一只坐在拱下的袋鼠，天空之下是一栏读物。
全站只有三种形状：圆角矩形、胶囊、正圆，没有一处直角。

> 早先有过一版完全不同的设计（满幅左右分栏 + 滚动驱动的视差胶片，参照
> `docs/5bb4eb118bb50.mp4`）。那一版连同 `src/styles/stage.css` 已整体移除，
> 那支录屏只作为历史留档，不再是任何代码的依据。

### 骨架

每一页顶部都是一块 `.sky`（见 `components/layout/Sky.tsx`），站点头就压在天最深的
那一段上。首页用 `tall`（整套演出），内页用 `short`（只留云，标题排在云上方的空里）。

层序是这套设计的核心，写在 `src/styles/sky.css`：

```
天(0) → 彩虹拱(1) → 云(2) → 袋鼠(3) → 内容(4)
```

于是拱脚插进云里而不是在半空中断掉，袋鼠坐在云前面。最前面那层云的填充色就是
`--paper`，所以天与正文之间没有硬边 —— 看起来是纸从底下漫上来。

### 三个插画构件

都在 `src/components/brand/`，纯 SVG，没有位图也没有 JS：

| 构件           | 做法                                                                 |
| -------------- | -------------------------------------------------------------------- |
| `RainbowArc`   | 七条同心圆弧，圆头虚线描边，每段成为一颗圆角药丸；环色取 `--arc-1…7` |
| `Clouds`       | 三层「矩形 + 骑在其上沿的一排圆」，同色不透明填充，并集天然光滑；画布定宽 5120 |
| `Kangaroo`     | 吉祥物 Roo；另有 `RooMark`（只有头）供商标与无封面兜底用             |

彩虹的药丸尺寸恒定、数量随半径变（外环更长所以更多颗），虚线周期由弧长整除得来，
相邻环错开半个周期砌出砖缝 —— 三条都写在 `RainbowArc.tsx` 的注释里，改之前先读。

云有三条同样别动的规矩，写在 `Clouds.tsx`：

1. **画布定宽 5120px，居中溢出**，不随视口拉伸。山丘的物理尺寸因此恒定（波长约
   580），窄屏只是少看见几座。按 `width:100%` 拉伸过一版，1440 屏上七座峰挤在一起，
   顶端连成规则的正弦波，读出来是扇贝花边不是云。
2. **谷是「调制峰高」做出来的，不是留空档**。山丘连续排布、高度从两侧向中间递减；
   留空档的话天际线塌回平直的地平线，两侧巨峰的斜边在这个尺度下几乎是直线，
   整个谷读成一个尖锐的三角楔子。
3. **`--cloud-h` 按 `--hero-h` 取比例**（0.78），不要各写各的单位。两者独立 clamp 过一版，
   宽屏上云带涨到封顶而英雄区早已封顶，云占满整个英雄区，拱门和袋鼠被埋掉。
4. **地平线压在画布底部附近**（396 / 420 / 438，画布高 456），起伏全靠峰高撑。
   谷底永远低不过地平线 —— 地平线定高了，谷再怎么调都会把彩虹拱腰斩。

**谷的位置和吉祥物绑定**：三层的峰高都在 x≈2800 降到最低，也就是袋鼠与拱门所在，
于是它们衬在一片开阔的天里。改 `--hero-shift` 时，峰高的低点要跟着挪。

### 色与字

- **一款字**：Figtree（`next/font` 注入）。700 压标题、400 排正文 —— 700 封顶是照参照稿定的，
  那套字（Wotfard，商业授权，本站不用）整站只加载 400/500/600，用 800 会明显粗一档。
  是把候选逐字渲染出来比对挑的：几何骨架 + 很高的 x-height + 近乎正圆的 o，
  单层 g 带开口钩尾、C 的开口很敞、A 尖顶偏宽。落选的各差在哪写在
  `styles/globals.css` 顶部。没有中日韩字形，中文落到系统 CJK 字体。
- **天空往下越深**（`--sky-1` → `--sky-3` 由浅到深）。云是浅色剪影，底下的天必须比它
  深才浮得出来；做成向下变浅的那一版里，`--cloud-back` 和天空撞成一个颜色，三层云糊成一片。
- **主色仍是洋红 `#e4008c`**，只用在眉标、链接与强调上；次级强调是紫 `#5b4bdb`
  （商标后半段、彩虹冷端）。要换色只需改 `tokens.css` 里那两行。
- **天上的眉标走紫不走洋红**：洋红落在天空蓝上对比度约 4.3:1，而眉标是 13px
  的小字，够不上 WCAG 的大号文字豁免。紫在整条天空渐变上都在 5:1 以上。
- **明暗两版**：暗色不是把白底反黑，而是把这片天变成夜空 —— 云层成深靛剪影，
  彩虹保持鲜亮（夜里它是唯一的光源）。切换器写 `<html data-theme>` + `localStorage`。

### 动效

全部集中在 `src/styles/motion.css`，一眼能看全这个站会动些什么。三类：

| 类别     | 内容                                                             |
| -------- | ---------------------------------------------------------------- |
| 入场     | 云浮起 → 彩虹由内向外逐环绽开 → 袋鼠落进拱下（总长 < 1.3s）      |
| 常驻     | 三层云各自横漂、袋鼠呼吸、彩虹的药丸沿弧缓慢流动（相邻环反向）   |
| 滚动揭示 | 列表条目进视口时淡入上浮，纯 CSS `view()` 时间线，没有一行 JS     |

外加几处微交互：商标里那颗袋鼠头在 hover 时轻轻一跳、明暗按钮的图标跟着转、
胶囊与圆按钮按下去有回弹。

装饰性动画一律关在 `prefers-reduced-motion: no-preference` 里。**没有**用常见的
`* { animation-duration: 0.01ms !important }` 全局兜底 —— 那条会把滚动驱动动画的
活动时长归零、进度锁死在 0%，带 `fill-mode: both` 的揭示动画于是停在 `opacity: 0`，
整份列表在「减少动态」下直接消失。

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
- **站点头不吸顶，常驻在英雄区那片天里**：吸顶头一旦滚出英雄区就得自己长出一层
  底色，而那层底色什么时候出现只有 JS 知道 —— 要么监听滚动，要么上
  `IntersectionObserver`。让天空留在文档流里、头部留在天里，全站一行滚动监听都不用，
  代价只是页面头会随滚动离开。
- **明暗切换的图标由 CSS 挑，不由 React state 挑**：当前主题存在 `localStorage` 里，
  服务端渲染时拿不到。用 state + `useEffect` 的话首帧一定是错的那一枚，水合后再跳一下。
  两枚图标一起渲染、由 `html[data-theme]` 显示其中一枚，首帧就是对的。
  同理注入 `data-theme` 的那段脚本必须是 `<body>` 的第一个子节点 —— 再往后就会先闪一下浅色。
- **SVG 的渐变 id 必须按实例加前缀**（`Kangaroo` / `RooMark` 的 `idPrefix` 是必填）：
  SVG 的 id 是文档级的，同一页出现两只袋鼠时后一份会把前一份的渐变整个抢走，
  表现是页脚那只正常、英雄区那只变成纯黑剪影。
- **彩虹拱用 `preserveAspectRatio="meet"`，云用 `"none"`**：云是软剪影，横向拉伸看不出来，
  用 `none` 才能随视口铺满；而彩虹那些圆头药丸一旦被拉宽，端帽会压成椭圆，一眼看出是拽出来的。
- **滚动驱动动画必须写 longhand 并显式给 `animation-duration: auto`**，不能用
  `animation: reveal linear both` 这种简写。简写省略时长拿到的是初始值 `auto`
  （css-animations-2 专门为滚动驱动动画从 `0s` 改成了 `auto`），`pnpm dev` 下正常；
  但生产构建里 Tailwind v4 的 Lightning CSS 会把简写展开成 longhand 并把时长写成 `0s`，
  动画活动时长归零、进度永远停在 0%，于是所有 `.feed__item` 停在 `opacity: 0` ——
  列表在生产环境里整个消失，而 dev 完全看不出来。这个坑踩过一次，
  守卫是 `motion.css` 顶部那段注释。改完那几条动画**必须**跑 `pnpm build` 起
  `next start` 复核。
- **`body` 上有一条 `overflow-x: clip`** 作为横向溢出的兜底（当前版面各断点都没有溢出）。
  是 `clip` 不是 `hidden`：`hidden` 会把 `body` 变成滚动容器，页内那些 `position: sticky`
  的边栏与目录会当场失效。
- **OG 图的两个字体文件提交进仓库**（`src/lib/og-fonts/`）：Satori 不读 CSS，
  必须拿到字体二进制，而 `next/font` 注入的是 CSS 变量。取的是 Figtree 的
  **静态**实例而不是 Google Fonts 仓库里那份可变字体 —— Satori 拿到可变字体只会渲染
  默认实例（wght 400），标题就永远粗不起来。构建期去网上拉字体只会多一种
  「CI 里偶发失败」的方式，这两个文件一年也不会动一次。

## 依赖 pin

`pnpm-workspace.yaml` 里两个 `overrides` 不要删：

- `unified: ^11.0.5` —— `next-mdx-remote` 与 `@shikijs/rehype` 各拉一个 unified，
  两份 `Processor` 类型不互认，插件数组会整段类型报错。
- `style-to-js: ^2.0.0` —— 1.x 的 CJS 构建把函数挂在 `exports.default` 上，
  `hast-util-to-estree` 拿到的不是函数，于是 Shiki 高亮出来的每个 `<span style>`
  都会以 “Could not parse \`style\` attribute” 让构建失败。rooquiz-docs 踩过同一个坑。
