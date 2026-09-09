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
- **云画布底部那层「收底纱」不能删**（`Clouds.tsx` 的 `#cloud-hem`）：
  云团各自的明暗渐变在 78% 处是背光档，而底部那些云团的包围盒大半在画布之外，
  露出来的正好是还没回到本色的那一段 —— 画布底边被裁开时上面是 246–253、
  下面是纯白纸面，一道 6 级灰阶的**笔直**横线横贯全宽。灰阶差很小，但直边最容易
  被眼睛抓住（马赫带），用户一眼就看出来了。纱从 y=264 渐变到 **y=336**（不是 340）：
  必须在画布底边之前就到满不透明，否则最后一行还透出 3% 的云色，仍留 1 级的线。
- **判断某团云有没有盖住基座的直角上边：`cy − ry ≤ base ≤ cy + ry`**。
  最前那层基座在 y=304，而塔基那两团的下沿停在 179 和 296 —— x 小于 185 单位那一段
  原来没有任何云团跨过 304，基座上边直接露成一道 8 级灰阶的直线（2000px 屏上 y≈610）。
  现在靠 `[40,300,110]` 和 `[150,316,100]` 两团补住，**这两团是修接缝的，别删**。
  往任何一层加减云团之后，都要重新按这条不等式检查基座上边有没有裸露。
- **接缝这类问题必须量，不能靠眼看**：把整行的平均色扫一遍找逐行跳变。
  修好之后逐行最大跳变应该在 1/255 上下（那已经是 8 位色深的量化极限）。
- **单独漂浮的那几朵小云（`Clouds.tsx` 的 `FLOATERS`）和三层云带是两套东西**：
  它们排在云带上方那片空天里、画在云带**后面**（飘过塔顶时被挡住，读作更远的云），
  而且**是 `infinite` 单向循环、没有 `alternate`** —— 起点和终点都在画布之外、
  `.sky` 又裁掉溢出，所以回绕看不见。云带做不到这件事（满幅图形首尾接不上）。
  只有 `band="full"` 有它们；内页从 y=150 开窗，它们全在 100 以上，天然落在窗外。
- **不要给漂浮的小云复用远层那对 `--cloud-back` / `--cloud-back-lo`**：背光档 #c2e4fe
  的亮度和它所在高度的天几乎相同（222.6 对 223）。大片云海无所谓（背光只出现在
  团与团的交界），可孤立小团有一半面积就是背光，那一半直接溶进天里 ——
  实测整朵只剩 **+1.4/255** 的对比，肉眼几乎看不见。现在走
  `--cloud-float-hi` / `--cloud-float-lo`，两档都在天之上（+26 / +14）。
  **这两个 token 在暗色下是对调的** —— 夜里三层的亮度关系整体翻转，
  照抄浅色顺序光就变成从下面来的。
- **小团要用自己的滤镜 `cloud-soft-sm`（σ=2）**，别用云带那个 σ=3：那是按半径
  90–110 的大团定的，用在半径 20–45 的小团上柔化比例是四五倍，整朵抹成一团雾。
  每朵各自一个滤镜组，不要合并 —— 合起来包围盒横跨整张画布，白白多出一大片
  每帧重绘的区域。
- **每层云有 `fill` 和 `shade` 两档色**（`--cloud-back` / `--cloud-back-lo` …）。
  少了背光那一档，三层叠出来只是一片雾，天际线糊成一团看不出是云。
- **内页那条矮云的顶边是一道裁剪线，必须靠 mask 渐隐化掉**
  （`.sky--short .sky__clouds` 的 3rem `mask-image`）。`band="low"` 在 y=150 开窗，
  而**裁剪只会露出云团内部、不会产生轮廓** —— 那条线上 83% 的宽度都被云团覆盖，
  裁出来就是一道 28/255 的笔直横线，1440 / 2000 / 2560 上都一样。
  `Clouds.tsx` 里原来那句「从 150 开窗露出来的才是起伏的天际线」是错的，已改。
  改 `LOW_BAND.y` 之前先确认那条渐隐还够不够长。
- **`--cloud-h-sm` 要跟着画布宽走**（`min(max(11.875rem, calc(max(100vw,84rem)*190/1512)), 20rem)`）。
  和 `--hero-h` 那条同理：写死 11.875rem 的话形变比 = 画布宽/1512，2000 上 1.32、
  2560 上 1.69。云带一长高就得把 `--hero-h-sm` 顶高同样的量，否则标题块被挤进云里 ——
  两者写成 `+ max(0px, var(--cloud-h-sm) - 11.875rem)` 是绑在一起的。
  1512 以下这一项恒为 0，那些宽度上逐像素不变。
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
- **页头那枚 logo 是内联 SVG，不是 `<img>`**（`components/brand/Logo.tsx`，
  原始资产 `public/brand/logo.svg`，两者一起改）。字母用 `currentColor` 才能跟着
  `html[data-theme]` 翻 —— 交付稿里它们是纯黑，暗色纸面上几乎看不见，而通过 `<img>`
  加载的 SVG 读不到外面的属性和 CSS 变量。**两组 path 的先后不能换**：红色三条在前、
  字母在后，所以字母压在袋鼠尾巴上（那条尾巴扫到 QUIZ 底下），换过来尾巴就骑到字上。
  要换图从设计交付重新导，不要手改那些 `d`。
- **`--brand-mark` 只给 logo 用**，不参与内容区配色。暗色下提亮到 #ff5f52
  （原值 #eb191d 压在深靛上发闷）。**主强调色仍然是紫 `--accent`，洋红 `--hot`
  全站只剩「订阅」那一枚眉标**
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
- **云不参与入场，别再给它加任何入场动画**。淡入试过：最前那层是纸色的、基座从
  y=304 铺到 380，而画布底边（天与纸的交界）在 340 —— 一透明那条交界当场露成一道
  横贯全宽的硬边。改成只做位移（上限 36 单位）交界不再露，但宽屏上云的画布是横向
  拉伸的，云带本身就是一大片软过渡，整体上移就是一块白在缓慢挪动，更脏。
  云唯一的动作是常驻横漂（`cloud-drift`），它不改变构图。
- **`--hero-h` 必须随视口宽变，不能写死一个 rem**（现在是
  `min(clamp(28rem, 33vw, 44rem), 76vh)`）。云的画布按视口横向拉伸而云带高度是
  `--hero-h` 的比例，写死的话每团云被拉扁的倍数 = 视口宽/1512 ÷ 0.9487：
  1440 → 1.00、2000 → 1.39、2560 → 1.78。**1440 恰好是 1:1 那个宽度**，所以只在
  它上面验会什么都看不出来 —— 这个坑踩过一次。**改版式一定要在 2000 和 2560 上看。**
- **袋鼠的纵向位置是固定 px（`--roo-w` 17.5rem），不跟 `--hero-h` 缩放**，
  于是天越高，它离纸面线越远（1440 上是天高的 93%，2560 上 62%）。1440/2000/2560
  三档都看过，云带底边也跟着天一起下移，它仍然坐在云脊上；**但再动这两个数之前
  要重新看图**，它随时可能浮空。要真绑死，得让 `--rail` 和 `--roo-w` 一起缩放，
  那会牵动整个栅格。
- **下落曲线必须是 `CustomEase`，不能用 `power*.in`**：内置 `.in` 系全是零速起步，
  袋鼠会先在半空静止一瞬再启动，那一瞬肉眼可辨，是「生硬」的最大来源。
  现在那条 `M0,0 C0.25,0.25 0.85,0.6 1,1` 初始斜率 1.0、末段 2.67 —— 一出现就在动，
  撞进去时是平均速度的 2.67 倍。
- **收势的三样东西挂在三个不同时钟上**（缩放 0.30s、位置反弹 0.16+0.20s、
  旋转 0.62s）。共用一条 elastic 试过，同一刻一起收干净就是机械感的来源。
- **正文一个字都不许进入场**：头条、文章流、右栏必须第一帧就在。头条逐条上浮试过，
  文章流不参与入场，于是半秒钟「第一篇空着、第二篇好好摆在下面」，中间两百多像素的白。
  会动的只有天上那些装饰（云、袋鼠、白丘）。
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
- **`next dev` 会把正在被 `next start` 服务的构建产物覆盖掉**（两者共用 `.next`），
  哪怕换了端口也一样 —— `next dev -p 8201` 一起，8200 手里那份 HTML 引用的 CSS
  当场全部 404，整页无样式。这一条比上一条阴险：你没跑 `pnpm build`，
  也没动任何代码，页面自己就坏了。**别在 `next start` 还开着的时候起 dev。**
  一分钟自检：
  ```bash
  for u in $(curl -s http://localhost:8200/en | grep -o '/_next/static/css/[a-z0-9]*\.css' | sort -u); do
    printf '%s → %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8200$u)"
  done   # 出现 400/404 就是这个坑，清 .next 重新 build 再重启
  ```
- **站点只支持英文，没有语言前缀**。早先是 en / zh 双语（路由 `/[locale]`、middleware 分流、
  hreflang、按语言分词的搜索索引），中文从未发布过内容，整套已移除。理由与保留项见
  README「只支持英文」一节。**数据层没动**：Postgres 的 `locale` 列、Storage 的
  `posts/en/` 前缀都还在，写入端一律写 `CONTENT_LOCALE`（恒为 `'en'`）——
  改前缀就得给已有对象改名。
- **站内路径统一用 `sitePath()`，而它在 `src/lib/routes.ts`，不在 `lib/content`**。
  这个分家是必须的：`lib/content` 会读 `.content/index.json`、因此 import 了 `node:fs`，
  客户端组件（搜索结果那几条链接）只要从那里取一个纯字符串函数，webpack 就会把
  `node:fs` 拖进浏览器 bundle，构建直接失败（`UnhandledSchemeError`）。踩过一次。
  **别在 `lib/content` 里给 `sitePath` 留 re-export** —— 留个转发口就等着下次再踩。
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
