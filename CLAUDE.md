代码中注释使用中文，其他都以英文为主，git commit message 使用英文
不要新建 git 分支

## 项目

RooQuiz 博客（`blog.rooquiz.com`）。MDX 正文在 Supabase Storage，元数据在 Supabase
Postgres，构建期固化成纯静态站部署到 Vercel。无后台，发布走 `/api/posts`。

版式是「一片天 + 两座软边云塔 + 一只坐在云上的袋鼠」，天空之下是一栏读物。
首页把最新一篇提成头条，压在那片天里；右栏顶上坐着袋鼠，往下接分类与订阅。
整套推导见 `README.md`「视觉设计」一节，以及 `src/styles/sky.css` 与
`src/components/brand/*.tsx` 的注释。架构与不显然的技术决定见 `README.md`。

**参照稿是仓库根目录的 `demo.png`，吉祥物原图是 `roo.png`**（两个都没入版本库）。
版式、配色、字号都是从 `demo.png` 上逐点量出来的 —— 改英雄区之前先打开它比一遍。
`roo.png` 是设计交付的 1490×1056 原稿，`public/brand/` 下那两张 WebP 是从它裁出来的。

早先还有两版设计已整体移除，**都不要再当依据**：
一版是满幅分栏 + 滚动驱动视差，一版是彩虹拱门 + 矢量袋鼠。

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

### 版式与插画

- **那片天是纯装饰层，不包内容**：`.sky` 绝对定位在 `.frame` 顶部、高度写死
  （`--hero-h` / `--hero-h-sm`），内容照常在文档流里从头排下来，
  想压在天里的自己把上边距排够。**别改回「内容套在天里、天的高度由内容撑」**——
  首页那种「英雄区从天里一路排到纸面」的版式那样就得靠负 margin 把下半段拽回来，
  每个断点手调一次。层序只有两层：天(0) → 其余一切(1)，靠
  `.frame > :not(.sky)` 一条规则抬起来。`.sky` 上的 `isolation: isolate` 别删。
- **袋鼠是位图，不是 SVG**（`public/brand/roo.webp`，头单独一张 `roo-head.webp`）。
  参照稿那只是三维渲染的插画，矢量翻译出来是另一个角色 —— 之前那版矢量袋鼠
  连同 `RainbowArc` 已整体删除。两张图刻意用原生 `<img>` 不走 `next/image`，
  理由写在 `components/brand/Roo.tsx` 顶部。
- **云的四条规矩**写在 `Clouds.tsx` 顶部：画布定宽 1512 单位按视口拉伸、
  底边 y=340 就是纸面线、两座塔必须在最左最右、每层要十几团中等大小的云。
  改之前先读，四条都踩过。
- **每层云有 `fill` 和 `shade` 两档色**（`--cloud-back` / `--cloud-back-lo` …）。
  少了背光那一档，三层叠出来只是一片雾，天际线糊成一团看不出是云。
- **内页那条矮云是「开窗」不是「压扁」**：`Clouds` 的 `band="low"` 只把 viewBox
  的下半截取出来（`LOW_BAND`），纵向仍是 1:1。直接把 340 单位塞进 150px 试过，
  每团云被压成扁椭圆，一排下来读作一串气泡。`LOW_BAND.h` 和 sky.css 里
  `.sky--short` 的 `--cloud-h` 是一对，改一个要改两个。
- **袋鼠脚下那座白丘画在袋鼠身上（`.home__perch::before`），不在云里**：
  云的画布随视口横向拉伸，而袋鼠的横坐标跟着居中的 `.shell` 走，
  1280 和 1920 之间两者会错开一百多像素，袋鼠就悬在丘的一侧了。
- **`--cloud-h` 必须按 `--hero-h` 取比例，不能各写各的单位**：两者都用 vw/rem 独立
  clamp 过一版，宽屏上云带涨到封顶而那片天早已封顶，云于是占满整片天、
  把天际线顶到导航底下。绑成比例后构图在任何视口下一致。
- **天空渐变是往左下越浅的**（右上最深），三个色标 + 195deg，都是量 `demo.png`
  反解出来的。写成 155deg 试过 —— 那是朝右下，深浅整个左右颠倒。
  两档线性也试过，中段和左上角对不齐，参照稿这条渐变前六成慢、后四成陡。
- **标题字重 700 封顶，不要用 800**：参照稿那套字整站只加载 400/500/600，
  最重就是 600；800 会明显粗一档。Figtree 每档略轻，所以对到 700。
- **不要把站点头改成 `position: sticky`**。它常驻在那片天里是有意的：吸顶头滚出
  英雄区后需要自己长出底色，而那个时机只有 JS 知道。现在全站零滚动监听。
- **几何量走 `tokens.css` 的变量**（`--shell` / `--rail` / `--measure` / `--lede` /
  `--hero-h` / `--hero-h-sm` / `--gutter` / `--radius`），别在组件里写死尺寸。
- **主强调色是紫 `--accent`，洋红 `--hot` 全站只剩「订阅」那一枚眉标**
  （`.u-eyebrow--hot`）。参照稿就是这么分的。紫在最深那档天空蓝上是 5.0:1、
  在白纸上是 7.2:1，两边都够 —— 所以天上天下是同一枚眉标，
  不再像彩虹那版分出 `.u-eyebrow--sky`。
- **全站只有 Figtree 一款字**，是逐字比对挑出来的（圆 `o`、开口 `C`、单层带钩尾的 `g`）。
  换字前先把候选渲染出来和现状并排看，别凭字体名挑 —— 落选的几款差在哪写在
  `styles/globals.css` 顶部。
- **首页那个网格是两列两行 + `grid-template-areas`**（`main roo` / `main side`）。
  袋鼠单独占一格不是塞在右栏组件里 —— 窄屏塌成单栏后要靠 areas 把它排到最前面。
  第二行必须是 `minmax(0, 1fr)`，否则右栏那格的高度等于自己的内容高，
  里面 `position: sticky` 没有余量可滚，吸附等于失效。
- **网格格子上 `margin-inline: auto` + `max-width` 要夹一个 100%**
  （`max-width: min(100%, var(--measure))`）。内联方向有 auto 外边距时
  网格不适用 stretch，格子按 fit-content 定宽 —— 正文里一张宽表格能把
  `.article__body` 顶到 672px，而窄屏那一列只有 335px，多出来的被
  `overflow-x: clip` 直接切掉。踩过一次。

### 动效（`src/styles/motion.css` + `src/components/motion/HomeMotion.tsx`）

- **首页入场在 GSAP 里，其余动画在 CSS 里**，界线是「要不要跨元素对时间」。
  搬过去只为一件事：袋鼠触地那一帧，白丘被压出去一圈、袋鼠自己挤一下 ——
  两者要对到同一帧，CSS 只能各写 delay。**别把常驻横漂也搬进去**，它在 CSS 里零成本。
- **两边能共存是因为属性不同**：`motion.css` 的 keyframes 用 `translate` **独立属性**，
  GSAP 写 `transform`，CSS Transforms L2 规定两者分开合成（translate → rotate →
  scale → transform），所以是**叠加**不是互相覆盖。**别把 keyframes 改回 `transform:`
  简写** —— 那样两边就开始抢同一个属性，云会在入场第一帧跳掉一截。
- **入场的起点写在 CSS 的 `html[data-anim='js']` 下面，不能写死也不能交给 JS**：
  交给 `gsap.set` 要等水合，那时首页已经以终态画过一帧，会闪回；无条件写进 CSS 则
  JS 一挂内容就永久消失。三档由 `components/layout/motion-gate.tsx` 那段内联脚本管
  （`js` → `run`，超时 400ms 转 `off`），GSAP 读到 `off` 会直接跳终态。
  **改这组规则时每条都要前缀 `.frame--home`** —— `.cloud__layer` 内页也有、
  `.home__main` 分页页也有，那些页面没有 HomeMotion 去接手，少了前缀会白到兜底为止。
- **时间线上 `lazy: false` 不能删**：GSAP 默认把 `fromTo` 的起点攒到下一个 ticker tick
  才写，而放开 CSS 起点那句 `data-anim = 'run'` 是同步的，中间夹出一帧终态。
  宽屏多半采不到，390px 稳定复现 —— 靠 CDP 逐帧取样才看得出来。
- **袋鼠脚下那座白丘是伪元素，GSAP 选不中**，所以它的透明度和缩放走
  `.home__perch` 上的 `--perch-o` / `--perch-s`（默认值就是终态）。
- **云层的补间要 `force3D: false`**：默认 `"auto"` 会临时提升到 GPU，
  而那三层挂着 feGaussianBlur，提升后滤镜按低分辨率栅格化，Safari 上云边闪马赛克。
- **滚动驱动动画必须写 longhand 并显式给 `animation-duration: auto`**，绝不能用
  `animation: reveal linear both` 简写。简写省略时长拿到的是初始值 `auto`，dev 下正常；
  但生产构建里 Lightning CSS 会把它展开成 longhand 并写成 `0s`，进度锁死在 0%，
  带 `fill-mode: both` 的揭示动画停在 `opacity: 0` —— **列表在生产环境里整个消失**，
  而 `pnpm dev` 完全看不出来。改完必须跑 `pnpm build` + `next start` 复核，
  并 grep 产物 CSS 确认 `animation-duration:auto` 还在。
- **不要加 `* { animation-duration: 0.01ms !important }` 那条 reduced-motion 全局兜底**。
  它会用同样的方式把滚动驱动动画弄死（时长归零 → 进度 0% → `opacity: 0`）。
  现在的做法是把装饰性动画逐条关进 `prefers-reduced-motion: no-preference`。
- **自定义属性的媒体查询覆盖必须排在无条件声明之后**：这类变量没有特异度加成，
  同选择器下纯按源码顺序决胜。把 `@media` 那条写在前面，表现是
  「媒体查询明明匹配却不生效」，而且 devtools 里不容易看出来。踩过一次。
- **`.cloud__layer` 上的 `transform-box: view-box` 不能删**：默认参考盒是元素自身的
  包围盒，三层各自的包围盒不同，横移量按百分比算就会各不相同。

### 明暗主题

- **`<ThemeScript />` 必须是 `<body>` 的第一个子节点**（`app/[locale]/layout.tsx`）。
  往后挪一点就会先闪一下浅色再变暗。
- **切换按钮的图标由 CSS 按 `html[data-theme]` 挑，不要改回 React state**：
  当前主题存在 `localStorage` 里，服务端渲染时不可知，用 state 首帧一定是错的那一枚。
  同理它的 `aria-label` 是固定的「切换深浅色」，不是「切换到深色」。

### 其它

- **HeroUI v3 必须走 per-component 子路径**：`@heroui/react/card`，不是
  `@heroui/react`。barrel 在 Server Component 里会因 `client-only` 构建失败。
- **HeroUI 组件全是 `'use client'`**。正文（`components/mdx/`）、文章流、边栏、分页
  刻意不用它。要加交互组件，先想清楚这一屏是否值得多一份 react-aria。
- **内容页一律 `export const dynamic = 'force-static'`**，凡是列举得完的路由都要
  写 `generateStaticParams` + `dynamicParams = false`。新增页面后跑一次
  `pnpm build`，确认它在产物清单里是 `●`/`○` 而不是 `ƒ`。
- **窄屏截图别用 `chromium --headless --window-size=390,...`**：旧版 headless
  有最小窗口宽度（约 500），它会按 510 排版再把图裁到 390，看起来像整页横向溢出，
  其实是假的。要走 CDP 的 `Emulation.setDeviceMetricsOverride`。
- **改完样式要重启 `next start` 再看**：`pnpm build` 会换掉 CSS chunk 的 hash，
  而旧的 `next start` 进程还在用旧 HTML，引用的 CSS 已被删掉 → 整页无样式，
  表现是 `next/image` 的 `fill` 图铺满全屏。杀进程用 `lsof -ti :8200 | xargs kill`，
  `pkill -f "next start"` 匹配不到（进程名是 `next-server`）。
- **站内路径统一用 `localePath()`**（`src/lib/content/index.ts`），别手拼字符串
  —— 丢了 locale 前缀就是 404。
- **Storage key 前缀只有一个来源**：`src/lib/content/paths.ts` 的
  `postObjectPath()` / `mediaObjectPrefix()`，签发端与读取端共用。
- **`src/lib/supabase/admin.ts` 带 `server-only`**，别在组件里 import。
- **OG 图的字体是静态实例，不能换成可变字体**（`src/lib/og-fonts/`）：Satori 拿到
  可变字体只渲染默认实例（wght 400），标题就永远粗不起来。取法见那边的 README。
- **改配色要连 `src/lib/og.tsx` 顶部那组常量和 `app/[locale]/layout.tsx` 的
  `themeColor` 一起改**：Satori 不读 CSS 变量，OG 图那几个 hex 是手工对齐的；
  地址栏底色也是写死的 hex。
- **`pnpm-workspace.yaml` 的两个 overrides 不要删**（unified / style-to-js），
  原因写在 README「依赖 pin」一节。
- **别把 `sync-content.mts` 里的 CI 守卫改回静默回落**。缺凭据时在 CI 中必须让构建
  失败——静默回落会产出「部署成功但内容是样例」的站，排查起来毫无线索。
- `src/app/[locale]/kitchen-sink/` 是 HeroUI 主题验证用的临时页，站点定型后删掉，
  同时从 `RESERVED_SLUGS` 和 `robots.ts` 的 disallow 里摘掉。
