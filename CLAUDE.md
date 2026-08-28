代码中注释使用中文，其他都以英文为主，git commit message 使用英文
不要新建 git 分支

## 项目

RooQuiz 博客（`blog.rooquiz.com`）。MDX 正文在 Supabase Storage，元数据在 Supabase
Postgres，构建期固化成纯静态站部署到 Vercel。无后台，发布走 `/api/posts`。

版式是「一片天 + 一道彩虹拱门 + 一只坐在拱下的袋鼠」，天空之下是一栏读物。
整套推导见 `README.md`「视觉设计」一节，以及 `src/styles/sky.css` 与
`src/components/brand/*.tsx` 的注释。架构与不显然的技术决定见 `README.md`；
发布接口契约见 `docs/publishing-api.md`；AI / n8n 接入指南见
`docs/automating-publishing.md`（改接口或校验规则时要同步更新它）。

`docs/5bb4eb118bb50.mp4` 是上一版设计（满幅分栏 + 滚动驱动视差）的参照录屏，
那一版已整体移除，该文件只是历史留档，**不要再拿它当依据**。

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

- **层序不能动**：`天(0) → 彩虹拱(1) → 云(2) → 袋鼠(3) → 内容(4)`，定义在
  `src/styles/sky.css`。拱脚要插进云里、袋鼠要坐在云前面，全靠这个次序。
  `.sky` 上的 `isolation: isolate` 也别删 —— 没有它这套 z-index 会和页面别处打架。
- **`Kangaroo` / `RooMark` 的 `idPrefix` 是必填，且同一页不能重名**：SVG 的 id 是
  文档级的，两只袋鼠撞 id 时后一份会把前一份的渐变整个抢走（表现是其中一只变成
  纯黑剪影）。现有调用处各用各的前缀（`hero-roo` / `foot-roo` / `side-roo` /
  `cover-${slug}` …），新增一处就再起一个。
- **彩虹拱的三条几何规则**写在 `RainbowArc.tsx` 顶部（药丸尺寸恒定、周期由弧长整除、
  相邻环错半周期）。改环数 `RINGS` 必须同步增删 `tokens.css` 里的 `--arc-N` ——
  组件是按 `var(--arc-${i+1})` 逐环取色的，少一个色标那一环会直接不可见。
- **云的画布是定宽 5120px 居中溢出的，不要改回 `width: 100%`**：山丘的物理尺寸必须恒定，
  拉伸会把波长压短，天际线变成规则的正弦波，读出来是扇贝花边。它的
  `preserveAspectRatio="none"` 只用于纵向随 `--cloud-h` 缩放，横向始终 1:1。
  彩虹相反，用 `meet` —— 圆头药丸一旦被拉宽，端帽会压成椭圆，一眼看出是拽的。
- **`--cloud-h` 必须按 `--hero-h` 取比例，不能各写各的单位**：两者都用 vw/rem 独立
  clamp 过一版，宽屏上云带涨到封顶而英雄区早已封顶，云于是占满整个英雄区、
  把彩虹拱和袋鼠整个埋掉。绑成比例后构图在任何视口下一致。
- **标题字重 700 封顶，不要用 800**：参照稿那套字整站只加载 400/500/600，
  最重就是 600；800 会明显粗一档。Figtree 每档略轻，所以对到 700。
- **云的谷和 `--hero-shift` 绑定**：三层的峰高在 x≈2800（袋鼠与拱门所在）降到最低，
  它们才衬在开阔的天里而不是被云埋掉。改偏移量时峰高的低点要跟着挪，
  否则拱门会被腰斩。谷要用「调制峰高」做，不能留空档（会得到一个尖锐的三角楔子）。
- **天空渐变是往下越深的**，别反过来。云是浅色剪影，底下的天比它浅的话三层云会糊成一片。
- **不要把站点头改成 `position: sticky`**。它常驻在英雄区那片天里是有意的：吸顶头滚出
  英雄区后需要自己长出底色，而那个时机只有 JS 知道。现在全站零滚动监听。
- **几何量走 `tokens.css` 的变量**（`--shell` / `--measure` / `--hero-h` / `--hero-h-sm` /
  `--gutter` / `--radius`），别在组件里写死尺寸。
- **天上的文字用 `.u-eyebrow--sky`（紫）而不是 `.u-eyebrow`（洋红）**：洋红落在天空蓝上
  只有约 4.3:1，而眉标是 13px 小字，够不上 WCAG 的大号文字豁免。纸面上仍用洋红。
- **全站只有 Figtree 一款字**，是逐字比对挑出来的（圆 `o`、开口 `C`、单层带钩尾的 `g`）。
  换字前先把候选渲染出来和现状并排看，别凭字体名挑 —— 落选的几款差在哪写在
  `styles/globals.css` 顶部。

### 动效（`src/styles/motion.css`）

- **滚动驱动动画必须写 longhand 并显式给 `animation-duration: auto`**，绝不能用
  `animation: reveal linear both` 简写。简写省略时长拿到的是初始值 `auto`，dev 下正常；
  但生产构建里 Lightning CSS 会把它展开成 longhand 并写成 `0s`，进度锁死在 0%，
  带 `fill-mode: both` 的揭示动画停在 `opacity: 0` —— **列表在生产环境里整个消失**，
  而 `pnpm dev` 完全看不出来。改完必须跑 `pnpm build` + `next start` 复核，
  并 grep 产物 CSS 确认 `animation-duration:auto` 还在。
- **不要加 `* { animation-duration: 0.01ms !important }` 那条 reduced-motion 全局兜底**。
  它会用同样的方式把滚动驱动动画弄死（时长归零 → 进度 0% → `opacity: 0`）。
  现在的做法是把装饰性动画逐条关进 `prefers-reduced-motion: no-preference`。
- **袋鼠的定位和动画分在两个元素上**：外层 `.sky__roo` 用 `translate: -50%` 做横向居中，
  内层 `.sky__roo-art` 才跑入场与呼吸。合成一个元素的话两处 `translate` 互相覆盖，
  动画第一帧袋鼠会横向弹到左边去。
- **自定义属性的媒体查询覆盖必须排在无条件声明之后**：`--hero-shift` 这类变量没有
  特异度加成，同选择器下纯按源码顺序决胜。把 `@media` 那条写在前面，表现是
  「媒体查询明明匹配却不生效」，而且 devtools 里不容易看出来。踩过一次。
- **`.arc__ring` / `.cloud__layer` 上的 `transform-box: view-box` 不能删**：默认参考盒是
  元素自身的包围盒，那样七条弧会各绕各的中心缩放，入场时散成一团。
- 彩虹药丸「流动」的位移正好是一个虚线周期（`--period`，由 `RainbowArc` 算好传下来），
  循环处才无缝。改 `PILL` / `PILL_GAP` 不用动 CSS，但别把这个变量断掉。

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
- **`pnpm-workspace.yaml` 的两个 overrides 不要删**（unified / style-to-js），
  原因写在 README「依赖 pin」一节。
- **别把 `sync-content.mts` 里的 CI 守卫改回静默回落**。缺凭据时在 CI 中必须让构建
  失败——静默回落会产出「部署成功但内容是样例」的站，排查起来毫无线索。
- `src/app/[locale]/kitchen-sink/` 是 HeroUI 主题验证用的临时页，站点定型后删掉，
  同时从 `RESERVED_SLUGS` 和 `robots.ts` 的 disallow 里摘掉。
