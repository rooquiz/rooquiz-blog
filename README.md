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

一片天 + 两座软边云塔 + 一只坐在云上的袋鼠，天空之下是一栏读物。
全站只有三种形状：圆角矩形、胶囊、正圆，没有一处直角。

参照稿是仓库根目录的 **`demo.png`**（未入库），吉祥物原稿是 **`roo.png`**。
下面每个数值都是从 `demo.png` 上量出来再反解的 —— 改英雄区之前先打开它比一遍。

> 早先还有两版设计已整体移除，都不再是任何代码的依据：一版是满幅左右分栏 +
> 滚动驱动的视差胶片，一版是七环彩虹拱门 + 矢量袋鼠。

### 骨架

```
.frame                     position: relative; isolation: isolate
├─ .sky                    ← 纯装饰：绝对定位、高度写死、overflow: hidden
│   ├─ Contrails           两道细白弧（只有首页）
│   └─ Clouds              三层软边积云，底边就是纸面线
└─ 其余一切                 z-index 1，照常在文档流里从头排下来
    ├─ .shell > SiteHeader
    ├─ .shell.frame__hero   （只有内页：眉标 + h1 + 元信息）
    └─ children
```

**那片天不包内容。** 它绝对定位在 `.frame` 顶部、高度由 `--hero-h`（首页 28rem）
或 `--hero-h-sm`（内页 27rem 封顶）写死；内容照常从文档流的顶部往下排，
想压在天里的自己把上边距排够。于是首页那种「英雄区从天里一路排到纸面」
不需要任何负 margin —— 天有多高和内容有多长彻底解耦。
早先把内容套在天里（天的高度由内容撑），下半段就得靠负 margin 拽回来，
每个断点手调一次。

层序因此只有两层：天(0) → 其余一切(1)，靠 `.frame > :not(.sky)` 一条规则抬起来。
最前面那层云的填充色就是 `--paper`，所以天与正文之间没有硬边 ——
看起来是纸从底下漫上来。

### 首页那个网格

```
+-------------------+-------+
|                   |  roo  |   ← 袋鼠，压在天里
|       main        +-------+
|                   |  side |   ← 分类 / 订阅 / 关于
+-------------------+-------+
```

`grid-template-areas: 'main roo' 'main side'`，右栏 `--rail` 23rem
（参照稿量出来是 368px）。袋鼠单独占一格而不是塞进右栏组件里，是为了窄屏：
塌成单栏后 areas 直接把它排到最前面（roo → main → side），
而留在右栏里它会跟着分类一起掉到文章流后面 —— 而它是第一屏的主角。

最新一篇提成头条（`FeaturedPost`），字号放大一档、行长收窄到 `--lede` 36rem。
它和文章流里的条目是同一份信息，只是留白大一档；两者一起构成第一页的
`pageSize` 篇，头条不是额外多出来的一篇。

### 三个插画构件

都在 `src/components/brand/`：

| 构件                    | 做法                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| `RooMascot` / `RooHead` | 位图（`public/brand/*.webp`），从设计交付的 1490×1056 PNG 裁切缩放    |
| `Clouds`                | 三层「基座矩形 + 一排骑在上面的椭圆」，同色并集 + 一个 feGaussianBlur |
| `Contrails`             | 两道细白弧，天上唯一不动的东西                                        |

**袋鼠是位图不是 SVG。** 参照稿那只是三维渲染的插画（柔光、软阴影、渐变皮毛），
矢量翻译出来是另一个角色。两张图刻意用原生 `<img>` 而不是 `next/image`：
展示尺寸由 CSS 写死、已按 2× 出稿，不需要 srcset，而 `next/image`
会把每页都出现的品牌图绕到 `/_next/image` 这个 serverless 端点上。

云有四条别动的规矩，写在 `Clouds.tsx`：

1. **画布定宽 1512 单位、按视口横向拉伸**（`preserveAspectRatio="none"`）。
   1512 就是参照稿的视口宽，所以 15 寸屏上是 1:1。宽屏拉长是必须的 ——
   两侧那两座塔是构图的骨架，得永远贴着视口左右边缘。窄屏由 CSS 的
   `width: max(100vw, 84rem)` 兜住，改成居中裁切；不兜的话波长被压短，
   天际线读成扇贝花边。
2. **底边 y=340 就是纸面线**，最前那层填 `--paper`。任何一层的基座都不能高于 300，
   否则会在云带底部露出一条天色。
3. **两座高塔在最左最右，中间是一段低平的云原**，中段三层要拉开档次
   （远 170 / 中 220 / 纸色 280）。把中层调到接近纯白试过一版，
   纸色实际被顶到 y=200，标题一多半落在白底上，「天空之下是读物」就读不出来了。
4. **每层十几团中等大小的云（半径 90–110），不要四五团特大的。**
   半径全开到 150+ 那一版每层只剩三四个巨型圆，交叠界线也跟着变少，
   天际线成了两三条大弧，读作「白色色块」而不是积云。

**每层云有两档色**（`--cloud-back` / `--cloud-back-lo` …）：每一团的顶是亮的、
往下暗一档，靠 objectBoundingBox 的渐变给每个椭圆各来一份，
交叠处两团的明暗对不上，界线就自己浮出来了。少了背光那一档，
三层叠出来只是一片雾。

**内页那条矮云是「开窗」不是「压扁」**：`band="low"` 只把 viewBox 的下半截取出来
（`LOW_BAND`，190 单位），纵向仍是 1:1。直接把 340 单位塞进 150px 试过，
每团云被压成扁椭圆，一排下来读作一串气泡。

**袋鼠脚下那座白丘画在袋鼠身上**（`.home__perch::before`）而不是画进云里：
云的画布随视口拉伸，而袋鼠的横坐标跟着居中的 `.shell` 走，
1280 和 1920 之间两者会错开一百多像素，袋鼠就悬在丘的一侧了。

### 色与字

- **一款字**：Figtree（`next/font` 注入）。700 压标题、400 排正文 —— 700 封顶是照参照稿定的，
  那套字（Wotfard，商业授权，本站不用）整站只加载 400/500/600，用 800 会明显粗一档。
  是把候选逐字渲染出来比对挑的：几何骨架 + 很高的 x-height + 近乎正圆的 o，
  单层 g 带开口钩尾、C 的开口很敞、A 尖顶偏宽。落选的各差在哪写在
  `styles/globals.css` 顶部。没有中日韩字形，中文落到系统 CJK 字体。
- **天空往左下越浅**（右上最深）。三个色标 + 195deg，全是量参照稿反解的：
  竖向每 100px 变浅约 0x0b，横向整整 1500px 才变浅 0x22，所以角度只离正下方 15 度。
  写成 155deg 试过一版（那是朝右下），深浅整个左右颠倒，
  云塔最密的左边反而成了天最厚的地方，整片天读起来发闷。
  两档线性也拟过 —— 要么中段浅一档、要么左上角深一档，两头对不齐；
  参照稿这条渐变前六成慢、后四成陡，中间必须加一站。
- **主强调色是紫 `--accent: #4a37e0`**：眉标、链接、「继续读」、当前栏目都走它。
  选值卡在两条约束之间 —— 落在最深那档天空蓝上要 ≥ 5:1
  （眉标是 13px 小字，够不上 WCAG 的大号文字豁免），落在白纸上要够重不发飘。
  #4a37e0 是 5.0 / 7.2，所以天上天下是同一枚眉标，不需要再分一个 sky 变体。
- **洋红 `--hot: #bf22d6` 全站只剩「订阅」那一枚眉标**（`.u-eyebrow--hot`）。
  参照稿就是这么分的：它是 RooQuiz 的品牌色，留一处是为了不把品牌丢掉，
  只留一处是为了那一处真的跳出来 —— 满页洋红眉标时读者分不出哪个是行动点。
- **墨色是深海军蓝 `#0d2a63`**，不是中性黑：纯黑在这套浅蓝里太硬。
- **明暗两版**：暗色不是把白底反黑，而是把这片天变成夜空 —— 云层成深靛剪影。
  注意三层的亮度关系整体翻转了：浅色下越靠前越亮（最前是白纸），
  夜里越靠前越暗（最前是深色纸面），最远那层反而最亮，因为它接的是天光。
  切换器写 `<html data-theme>` + `localStorage`。

### 商标

页头那枚是设计交付的锁定版 logo：`RO` + 一枚红圈 O（圈里一只线稿袋鼠）+ `QUIZ`。
原始资产在 `public/brand/logo.svg`，站内用的是它的内联版本
`components/brand/Logo.tsx`（两者要一起改）。

**内联而不是 `<img src="/brand/logo.svg">`**：交付稿里字母是纯黑，压在暗色纸面上
几乎看不见，所以字母必须跟着主题走。而这个站的明暗是 `html[data-theme]` 手动切换的，
通过 `<img>` 加载的 SVG 是一份独立文档，读不到外面的属性也拿不到 CSS 变量 ——
它顶多能自己写一条 `prefers-color-scheme`，那只反映系统偏好，用户手动切过就是错的。
内联之后字母走 `currentColor`（跟 `--ink`）、红圈走 `--brand-mark`，两边都对。
代价是每页多约 10.7kB 路径数据（gzip 后约 4kB）。

`--brand-mark` 是品牌自己的红（#eb191d），**不参与内容区配色** —— 强调色仍然是紫，
洋红仍然只在「订阅」那一枚眉标上。暗色下提亮到 #ff5f52：原值压在深靛上，
那些细线读起来发闷（两版并排截图比过）。

换掉字标之后有两处跟着变了，都是有意的：字母是同一个颜色，不再有「后半段是紫的」
那个和眉标的呼应；hover 时袋鼠头轻轻一跳的彩蛋也撤了 —— 新 logo 里袋鼠的尾巴一路
扫到 QUIZ 底下，和字母是一个锁定图形，没有可单独动的部件。

`--logo-h` 是从旧字标反推的：logo 画布 514×140、字母占 y 38..96，而旧字标的大写高度
约等于字号的 0.72 倍，于是同样的字高对应 1.738 倍的整图高度。换了 logo，
页头那行字看上去还是原来那么大（实测 1440 下 165×45，390 下 139×38）。

页脚那只小袋鼠头和首页那只坐着的仍然是原来的三维插画位图，没跟着换。

### 动效

分两处，界线是「要不要跨元素对时间」：

| 归属                               | 内容                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/motion/HomeMotion.tsx` | 首页入场：白丘浮起 → 袋鼠带速度落下（弧线 + 旋转）→ **触地那一帧**挤压与白丘扩开 → 三个时钟错开收势 → 常驻呼吸；外加指针侧倾与点一下弹一跳 |
| `src/styles/motion.css`            | 常驻的三层云横漂、全部微交互，以及首页入场的**首帧起点**                                                                                   |

首页那段搬去 GSAP 只为一件 CSS 做不到的事：白丘的扩散和袋鼠的挤压要和落点对到
±30ms（实测在同一帧内完成），纯 CSS 只能给两个元素各写一个 delay，改一处就得
回头重算另一处。常驻横漂没跟着搬 —— 它在 CSS 里零成本。

**入场只动袋鼠和它脚下那座白丘，云和正文都不动。** 两样撤掉的东西各有原因：

云先是淡入 —— 最前那层是纸色的、天与纸的交界全靠它盖住，一透明就露出 `.sky`
那条矩形底边，一道横贯全宽的直线。改成只做位移之后交界不再露，但宽屏上另一个
问题浮出来：云的画布是横向拉伸的，2000px 宽的屏上每团云被拉成扁而阔的椭圆，
整条云带本身就是一大片软过渡，再让它整体上移，中段就是一整块白在缓慢挪动。
天空是背景，不是演员 —— 它唯一的动作是常驻横漂，那不改变构图。

头条那几行也逐条上浮过：文章流不参与入场，于是有半秒钟「第一篇是空的、第二篇
却好好地摆在下面」，中间一块两百多像素的白。装饰可以慢慢到位，读物不能。

袋鼠这一段重做过一次，原来那版「太生硬」的三个原因：落差 20%、时长 0.44s、
`power2.in` —— 末速只有 281 px/s，同样距离自由落体要 2140，那不是落下是被放下来；
`.in` 系内置 ease 全是零速起步，它会先在半空静止一瞬再启动；缩放、位置、旋转
共用一条 0.5s 的 elastic，同一刻一起收干净。现在落差 31%、时长 0.26s、
用 `CustomEase` 画一条初始斜率 1.0 / 末段 2.67 的曲线（一出现就在动），
加上弧线与 −5°→+1.5° 的旋转，收势分成 0.30 / 0.36 / 0.62 三个时钟。
触地从 0.72s 提到 0.36s：先快到，再慢慢稳住。

天上另有三朵单独漂浮的小云（`Clouds.tsx` 的 `FLOATERS`），排在云带上方那片空天里、
画在云带后面。它们和云带的关键差别是**可以单向循环**：起点终点都在画布之外、
`.sky` 裁掉溢出，回绕那一瞬看不见，所以是真的「飘过去」而不是「来回晃」。
周期 78 / 148 / 96 秒，其中最大那朵往左飘（和中层云带同向），三种速度错开读出视差。
关掉动画时它们停在各自的 `cx` 上，是三朵散在天上的静止云。

微交互仍在 CSS 里：明暗按钮的图标跟着转、胶囊与圆按钮按下去有回弹。
尾迹刻意不动 —— 一动它就变成装饰线，不再像是天上本来有的东西。
（商标那颗袋鼠头 hover 一跳的彩蛋随字标一起撤掉了，理由见下面「商标」一节。）

装饰性动画一律关在 `prefers-reduced-motion: no-preference` 里，**首帧起点也在里面** ——
于是减少动态时首页一帧都不依赖 JS。**没有**用常见的
`* { animation-duration: 0.01ms !important }` 全局兜底 —— 那条会把滚动驱动动画的
活动时长归零、进度锁死在 0%，带 `fill-mode: both` 的揭示动画于是停在 `opacity: 0`。

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
- **正文里的表格套一层 `overflow-x: auto` 的壳**（`components/mdx` 的 `MdxTable`）：
  表格的最小内容宽度是硬的，列不会自己折行。不套壳时 390px 视口里
  `.article__body` 会被顶到 510px，而 `body` 上那条 `overflow-x: clip`
  把多出来的部分直接切掉，读者根本看不到右边几列。
  同一个坑还要求网格格子上 `margin-inline: auto` 的 `max-width` 夹一个 100%
  —— 内联方向有 auto 外边距时网格不适用 stretch，格子按 fit-content 定宽。
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
- **吉祥物走位图不走 SVG，并且用原生 `<img>` 不用 `next/image`**：
  理由分别写在 README 上面那节和 `components/brand/Roo.tsx` 顶部。
  文章配图仍然走 `next/image` —— 那些是运行时才知道尺寸的远端图。
- **只有首页那段入场用 GSAP，别的动画都留在 CSS**：换来的是「触地的因果」——
  袋鼠落到丘上那一帧，丘被压得往外扩一圈、袋鼠自己挤一下。这个要跨两个元素对时间，
  CSS 只能各写 delay。代价是首页的 First Load JS 从 ~104kB 涨到 136kB
  （gsap core 约 20kB gzip），只进首页 chunk，别把它引到别的路由去。
  常驻横漂留在 CSS 是因为两边能共存：那些 keyframes 用的是 `translate` **独立属性**，
  GSAP 写 `transform`，CSS Transforms L2 规定两者分开合成，所以是**叠加**不是互相覆盖
  —— 别把 keyframes 改回 `transform:` 简写，那样就开始抢同一个属性了。
- **入场动画的起点由 CSS 给、由一段内联脚本决定它成不成立**
  （`components/layout/motion-gate.tsx` 写 `html[data-anim]`）：起点交给 `gsap.set`
  就得等水合，那时首页已经以终态画过一帧，会看到闪回；而 `opacity: 0` 一旦无条件写进
  CSS，JS 挂掉首页内容就永久消失。所以 `js` / `off` / `run` 三档 —— 无 JS 时属性从未
  写上、规则不匹配；水合超过 400ms 由兜底计时放行，且 GSAP 后到时会读出 `off`
  直接跳到终态，不会把已经露脸的内容重新藏起来。三条路径都用 CDP 逐帧取样验过。
- **`HomeMotion` 的时间线必须带 `lazy: false`**：GSAP 默认惰性渲染 `fromTo` 的起点，
  攒到下一个 ticker tick 才写，而放开 CSS 起点的那句 `data-anim = 'run'` 是同步的，
  中间夹出一帧终态 —— 首页闪一下再被拽回起点。宽屏上多半采不到，390px 上稳定复现。
- **滚动驱动动画必须写 longhand 并显式给 `animation-duration: auto`**，不能用
  `animation: reveal linear both` 这种简写。简写省略时长拿到的是初始值 `auto`
  （css-animations-2 专门为滚动驱动动画从 `0s` 改成了 `auto`），`pnpm dev` 下正常；
  但生产构建里 Tailwind v4 的 Lightning CSS 会把简写展开成 longhand 并把时长写成 `0s`，
  动画活动时长归零、进度永远停在 0%，于是所有 `.feed__item` 停在 `opacity: 0` ——
  列表在生产环境里整个消失，而 dev 完全看不出来。这个坑踩过一次，
  守卫是 `motion.css` 顶部那段注释。改完那几条动画**必须**跑 `pnpm build` 起
  `next start` 复核。
- **`body` 上有一条 `overflow-x: clip`** 作为横向溢出的兜底（当前版面 390 / 820 /
  1512 都量过，没有溢出）。
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
