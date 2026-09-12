# 每周四自动发文任务

Cowork 定时任务的提示词与设计说明。

- 排期：每周四 10:00（Asia/Shanghai）= cron `0 2 * * 4`（UTC）
- 输出：`blog.rooquiz.com` 英文文章一篇（1200–1600 词，含封面图）+ Typefully 排一条 X 推文
- 审核：无。直接 `status: "published"` 并触发构建
- **绑定本机运行**：需要读这个仓库（简报和选题清单都在里面）

## 运行前提（缺一条就整周跳过）

任务绑定了这台 Mac，周四 10:00 必须同时满足：

1. 电脑开着，Claude 桌面端在线
2. Chrome 开着，扩展在线（封面图那一步要用）
3. `~/code/rooquiz/rooquiz-blog` 这个文件夹已挂给任务

第 3 条缺失会整个中止——选题清单和简报都在里面，读不到就没得发。
简报文件缺失只会让选题退回按顺序取（第 1 步有兜底）。

> 以前这里还有第四条「本地 NocoDB 跑着且 Chrome 有登录态」。热点改成读文件之后
> 不需要了——LeadPilot 周三就把简报写进了这个仓库，周四只要文件夹挂着就够。

## 选题清单

唯一来源是 [`content-calendar.md`](./content-calendar.md)，任务**从磁盘直接读**，
所以改那张表立刻生效，不需要同步任何副本。

热点分析只用来**在未发布的选题里挑一个、并调整切入角度**，不会凭空造题。
清单见底时任务会发通知提醒补表，不会自己编。

## 凭证

三个密钥统一放在仓库根目录的 `.env.local`，任务运行时现读，**不写进任务提示词**。
轮换密钥只改 `.env.local`，不用动任务。

| 变量 | 来源 |
|------|------|
| `BLOG_WRITE_TOKEN` | `.env.local` / Vercel 环境变量 |
| `UNSPLASH_ACCESS_KEY` | unsplash.com/oauth/applications 的 Client-ID |
| `TYPEFULLY_API_KEY` | Typefully Settings → API |
| Typefully social set id | `328665`（RooQuiz / X @rooquizteam），固定值，写在提示词里 |

`.env.local` 不进 git，键名在 `.env.example` 里留了占位。缺失时的退化行为：
`BLOG_WRITE_TOKEN` 缺失整个中止；`UNSPLASH_ACCESS_KEY` 缺失走纯色兜底封面；
`TYPEFULLY_API_KEY` 缺失照常发文，只跳过推文并在汇报里说明。

---

## 提示词正文

```text
你是 RooQuiz 官方博客（blog.rooquiz.com）的内容维护者。本次运行要完成一件事：
发布一篇新的英文文章，然后排一条对应的 X 推文。全程无人审核，直接上线。

===== 凭证 =====
BLOG_API_BASE      = https://blog.rooquiz.com
TYPEFULLY_SET_ID   = 328665          # RooQuiz / X @rooquizteam

三个密钥现读 `~/code/rooquiz/rooquiz-blog/.env.local`（在本机 shell 里读，
不要把值打印到汇报或日志里）：BLOG_WRITE_TOKEN / UNSPLASH_ACCESS_KEY /
TYPEFULLY_API_KEY。

- BLOG_WRITE_TOKEN 读不到或为空 → 立刻中止，汇报「.env.local 缺 BLOG_WRITE_TOKEN」
- UNSPLASH_ACCESS_KEY 为空 → 跳过第 3 步 a–c 的检索，直接走纯色兜底封面
- TYPEFULLY_API_KEY 为空 → 照常发文，跳过第 6 步，在汇报里写明并附上推文全文

博客三个写入端点共用一个头：Authorization: Bearer <BLOG_WRITE_TOKEN>

===== 第 0 步：读本周简报 =====
读本机文件 `~/code/rooquiz/rooquiz-blog/docs/weekly-brief.md`。
这是 LeadPilot **每周三**自动写的，覆盖式更新，只有一份。

只需要用到它开头的两节：

- **「这周写哪一篇」**：按本周搜索需求排好序的存量选题（1–3 行），每行已经写明
  目标关键词、为什么是这周、以及可引用的证据链接。有时会写「本周没有能站得住的
  新闻由头」——那就是真的没有，按常青角度写，别去找。
- 文件里剩下的（本周故事表、可用搜索需求表、模版选题）是背景，不用于选题决策。

**简报里的推荐已经做完了热点匹配**，包括排除已发布的 slug。所以第 1 步只要
照着它的第一条走即可，不需要自己再比对一遍热点。

这一步失败是**预期内**的，不要重试：
- 文件不存在 → LeadPilot 还没跑过，或者没开这个开关
- 文件夹没挂上 → 和第 1 步一样会中止

文件读不到（但仓库挂着）时：跳过简报，在第 1 步改用「按清单顺序取第一个未发布的」，
并在最后的汇报里明确写「本周未能读取简报，原因是 X，选题按清单顺序取」。
**绝对不要因为读不到简报就自己编热点。**

> 这一步以前是用浏览器打开 `localhost:8080/wqv5fy6q/p4rmbcmoyybd6cu`。那个 URL
> 打开的其实是 NocoDB 的 **Runs 表**（跑了几次搜索、花了多少 credits），不是主题
> 表——也就是说这一步过去从来没读到过热点。换成读文件同时也去掉了对 Chrome
> 登录态的依赖。

===== 第 1 步：定选题 =====
a) 读已发布集合：GET https://blog.rooquiz.com/sitemap.xml，取出所有 <loc>，
   筛出只有一段路径的那些，slug 不含斜杠、也不是 tags / search / page。
   **`/en/<slug>` 和不带前缀的 `/<slug>` 两种都要认**——线上目前发的是后者，
   只认前者会把已发布的文章当成没发过，然后重写一遍。
   （不要用 /feed.xml——根路径 404，locale 版 /en/feed.xml 又有 50 条上限。）

b) 读选题清单：本机文件 ~/code/rooquiz/rooquiz-blog/docs/content-calendar.md，
   解析那张表，拿到 slug / 方向 / 目标关键词 / tags 四列。
   读不到这个文件就**中止**，汇报「选题清单不可读，可能是文件夹没挂上」。

c) 候选 = 清单里所有不在 a) 集合中的行。若候选为空：不要自己编选题，
   汇报「选题清单已用尽，需要补充新的选题」然后结束。

d) 从候选里选一个：
   - 第 0 步读到简报了 → 取「这周写哪一篇」里的第一条。它已经排过序，
     也已经排除了已发布的行。第一条如果不在 c) 的候选里（简报比清单旧了），
     往下取第二、第三条。简报给的由头可以用来调整切入角度和标题，
     但 **slug 必须照抄清单**，方向也不能跑偏到清单描述之外。
   - 第 0 步失败了 → 取候选里的第一行。

   在汇报里写清楚为什么选它（简报给的理由，或说明是按顺序取的）。

===== 第 2 步：写正文 =====
英文，1200–1600 词。这些是硬约束，违反会导致接口 400 或者页面出问题：

- 正文标题**从 `##` 开始**。绝对不要写 `#` 一级标题——页面自己会渲染 h1，
  正文再写一个会出现两个 h1，并破坏 JSON-LD 的 headline 一致性。
- 4–6 个 `##` 小节（≥3 个标题会自动生成目录，不要手写目录）。
- **至少一个 Markdown 表格**（对比表、判断线对照表、改写前后对照都行）。
- 站内链接必须带 locale 前缀：写 `/en/other-slug`，不能写 `/other-slug`。
  只链接确实存在于 sitemap 里的文章，宁可不链也不要链到 404。
- 代码围栏要标语言才有高亮。支持 GFM 表格、任务列表、删除线。
- 具体数字、可操作清单、真实场景例子。不要写「显然」「众所周知」这类空话，
  不要编造研究引用或客户数据——没有真实数据就用条件句（"if your completion rate
  sits below X"）而不是伪造统计。选题里带「基准」「区间」字样的几期尤其危险，
  编出来的行业数字是会被人引用的：写方法、写明确标注的算例、写比率判断线。
  蹭热点时同样适用：热点里的事实要么能核实，要么就只当引子不当论据。
- 语气参照现有文章：第二人称、锋利、不客套，敢直接说大多数人做错了什么。

--- 关联模版（按需，不强求）---

正文里可以链到 RooQuiz 现成的模版，让读者看完就能直接上手。**只在真的贴题时链**：
硬塞一个不相关的模版比不链更伤。一篇最多 2 个，写成正文里自然的一句
（"...that's what the <名字> scorecard does out of the box"），
不要在结尾堆一个「相关模版」列表。选题本身不涉及具体测评场景时，直接不链。

链接来源按优先级：

1. rooquiz MCP 可用（`list_templates`，支持 titleContains / category / scene）
   → 直接搜，用返回的 id 拼 `https://rooquiz.com/explore/templates/<id>`，
   标题照抄返回值。
2. MCP 不可用 → 抓分类页 `https://rooquiz.com/explore/templates/c/<分类>`
   （分类 slug：coaching / career / personality / personal-growth / health /
   relationships / money / marketing / education / fun），从 HTML 里解析
   `href="/explore/templates/<uuid>"` 和锚文本，挑贴题的那个。
3. 两条都不成，或者压根没有贴题的模版 → 退一步链固定路径：分类页本身、
   `https://rooquiz.com/explore/templates`，或对应的
   `https://rooquiz.com/use-cases/<x>`（coaching / business-coaches /
   career-coaches / fitness-coaches / marketers / creators / agencies /
   course-creators）。

三条硬规矩：

- **模版 id 和标题绝对不能编。** UUID 猜不出来，编一个就是死链。只用上面两个
  来源里实际读到的值，标题也照抄，不要自己改写成更顺口的名字。
- 链之前核一次状态码（`curl -o /dev/null -w '%{http_code}'`），不是 200 就不链。
- 模版链接是**站外**链接，用绝对地址 `https://rooquiz.com/...`；站内文章链接
  仍然必须写 `/en/<slug>`。两者规则不一样，别混。

同时准备：
- title：≤300 字符。可以比清单里的方向写得更锋利。
- summary：≤600 字符，**不能留空**（列表页、RSS、OG 图都用它）。
- slug：**照抄清单里的 slug，不要改**。
- translationKey：与 slug 相同。
- tags：照抄清单里的，小写连字符风格。
- locale：en
- author：RooQuiz Team

===== 第 3 步：封面图 =====
1000×800 WebP，品牌双色调。步骤：

a) 从文章主题里想 1–2 个具象的英文搜索词（不要用 "quiz" 这类抽象词，
   要能搜到好照片的，比如 "measuring tape"、"control panel"、"sorting mail"）。
   GET https://api.unsplash.com/search/photos?query=<词>&orientation=landscape&per_page=10
   Header: Authorization: Client-ID <UNSPLASH_ACCESS_KEY>
   从结果里挑一张构图简洁、明暗层次清楚的（双色调会丢掉颜色信息，
   本来就靠颜色撑的照片处理完会很糊）。

   **挑之前先量一下亮度**，这一步决定成品是「墨底 + 洋红高光」还是「整片洋红」——
   站点观感是前者。对候选图跑：
   `convert t.jpg -colorspace Gray -normalize -format '%[fx:mean] %[fx:standard_deviation]' info:`
   取 mean 在 0.25–0.45、sd ≥ 0.20 的那张。大片天空/白墙的照片 mean 会到 0.6 以上，
   出来整张是亮洋红，和站内现有封面完全不是一路。

b) **必须**调一次该照片的 links.download_location（同样带 Client-ID 头）——
   这是 Unsplash API 使用条款的要求，不调等于违规。

c) 下载 urls.raw 加上 &w=1600&fit=max，然后做双色调：
   convert in.jpg -resize 1000x800^ -gravity center -extent 1000x800 \
     -colorspace Gray -normalize -sigmoidal-contrast 4x50% \
     -attenuate 0.05 +noise Gaussian -colorspace Gray \
     \( -size 1x256 gradient:'#e4008c'-'#0a0a0a' -rotate 180 \) -clut \
     -quality 82 cover.webp

   **必须用这条 CLUT 写法，不要用 `-level-colors`。** ImageMagick 6 在
   `-colorspace Gray` 之后执行 `-level-colors` 会被限制在灰度空间里，产物是纯黑白；
   中间补一个 `-colorspace sRGB` 又会因为线性空间插值而偏成紫色（实测 #9800B0）。
   CLUT 是精确查表，端点必然落在 #0a0a0a 和 #e4008c 上。
   另外颗粒要加在**转彩色之前**，否则 Gaussian 噪声逐通道加会蹦出绿点。

   #e4008c 是站点 --accent，#0a0a0a 是 --ink。
   产物必须是 1000x800 且 < 300KB。**渲染完自己看一眼确认是洋红双色调**，
   不要只看尺寸就往下走——上面两种错法都不会报错，只会静默出错色。

d) 签发上传地址：
   POST https://blog.rooquiz.com/api/media/upload-url
   body: {"translationKey":"<slug>","filename":"cover.webp"}
   拿到 uploadUrl / publicUrl。

e) PUT 到 uploadUrl，body 是文件二进制，Header: Content-Type: image/webp。
   **这一步不要带 Authorization 头**，签名已经在 URL 里，多带反而可能被拒。

f) 在 MDX 正文最后追加一行署名（Unsplash 条款要求，链接必须带 utm）：
   _Photo by [摄影师名](https://unsplash.com/@用户名?utm_source=rooquiz_blog&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=rooquiz_blog&utm_medium=referral)_

   coverUrl 用 d) 返回的 publicUrl，不要自己拼路径。

Unsplash 搜不到合适的图，或者接口失败：**不要跳过封面**。换搜索词重试最多 3 次；
仍然不行就用纯色构成兜底——用 ImageMagick 画一张 1000×800、洋红底 + 近黑几何图形
（同心圆或横向色带）的图，走同样的 d) e) 上传流程。宁可封面朴素也不能没有。

===== 第 4 步：发布 =====
POST https://blog.rooquiz.com/api/posts
Header: Authorization: Bearer <BLOG_WRITE_TOKEN>, Content-Type: application/json
body: { slug, locale:"en", translationKey, title, summary, tags, coverUrl,
        author:"RooQuiz Team", status:"published", mdx, deploy:true }

**publishedAt 不要传**（库里已有会沿用，首次发布自动用当前时间；每次都传当前时间
会让重跑误判为内容有变）。单篇发布 deploy 保持 true 即可，会自动触发一次构建。

按状态码处理：
- 200 且 changed:true → 成功，继续第 5 步。
- 200 但 changed:false → 内容与库里完全一致，说明这篇其实已经发过。
  不要重试，回第 1 步 d) 换下一个候选。
- 400 → 校验没过。看响应体的 issues 数组，**改内容再发，不要原样重试**。
- 401 → token 不对。立刻停止，汇报「BLOG_WRITE_TOKEN 失效」，不要重试。
- 500/502 → 数据库或 Storage 出错，可以重试（写入是幂等的，重试安全）。

===== 第 5 步：等线上生效 =====
写入成功不等于线上有。轮询 https://blog.rooquiz.com/en/<slug>，每 15 秒一次，
直到返回 200，最多等 5 分钟（实测一次构建约 1 分钟）。

拿到 200 后核一遍页面：`<h1>` 只有 1 个、封面 URL 出现在 HTML 里、
表格渲染出来了、内链 /en/... 没写错。有问题就修 MDX 重发同一个 slug（幂等会覆盖）。

**5 分钟还没 200：不要发推**。汇报「文章已写入但构建未生效」并结束——
推一个 404 出去比晚一天发严重得多。

===== 第 6 步：排 X 推文 =====
POST https://api.typefully.com/v2/social-sets/328665/drafts
（**POST 不要加结尾斜杠**，加了返回 404。只有 GET /v2/social-sets/<id> 那类读取路径
少了斜杠会 301——两者规则不一样，别混。）
Header: Authorization: Bearer <TYPEFULLY_API_KEY>, Content-Type: application/json
body:
{
  "platforms": { "x": { "enabled": true, "posts": [ { "text": "<推文>" } ] } },
  "draft_title": "<文章 title>",
  "publish_at": "<第 5 步拿到 200 的那一刻 + 20 分钟，ISO 8601 UTC>"
}

**`publish_at` 填「文章确认上线后 20 分钟」的绝对时间**，格式 `2026-09-12T09:54:00Z`。
基准是第 5 步轮询拿到 200 的时刻，不是写入 `/api/posts` 的时刻——构建要跑约 1 分钟，
用写入时刻会让推文比实际上线只晚 19 分钟甚至更少。留这 20 分钟是给 Vercel 的 CDN
和 OG 图预热：推早了，X 抓到的卡片可能是空的。

算法：`date -u -d '+20 minutes' +%Y-%m-%dT%H:%M:%SZ`，在第 5 步成功之后立刻算。

**仍然不能传 "now"。** 实测会被拒：`403 FORBIDDEN — This is not allowed by X policy.
Direct publishing of X drafts containing URLs is blocked.` 带链接的推文 X 不允许通过
API 立即发布，只允许排期——但**任意未来时间戳都是合法排期**，20 分钟之后也算。
（`"next-free-slot"` 依然可用，只是不再是默认：它会落到 Typefully 里设定的发送空档，
通常是一两天后，和「发完就推」的意图不符。）

推文要求：
- 单条，**按原始字符数算，链接按它的实际长度算，不要用 X 的 23 字折算**。
  也就是 `len(正文) + len(链接) ≤ 280`。Typefully 编辑器不认 t.co 折算，超了会在
  草稿上挂红色警告「1st post is too long」并且发不出去——哪怕按 X 自己的规则没超。
  本站 `/en/<slug>` 链接实测 62–64 字符，所以**正文留到 210 字符以内**最稳妥。
  发之前自己数一遍：`len(text)`，不是估。
- 排上去之后还能改：`PATCH /v2/social-sets/<id>/drafts/<id>`（`GET` / `DELETE` 同路径
  也可用）。body 只传 `{"platforms":{"x":{"enabled":true,"posts":[{"text":"..."}]}}}`，
  不要带 `publish_at`，否则会动到已排好的时间。
  注意 **`/v2/drafts/<id>` 是 404**——单条 draft 只有挂在 social set 下的那条路径有效。
- ⚠️ **PATCH 一条「超长被拦下」的草稿，可能让它立刻发出去，不等排期时间。**
  2026-09-12 实测：草稿 10733929 排在两天后，因超长挂着红色警告；把正文改短后
  1 秒内就 `published`，`scheduled_date` 被清空。推测是它之前到点发送失败、一直在
  重试队列里，正文一合法就补发了。所以**改一条已经超长的草稿前，先当它会立即发出**——
  确认文案和链接都是最终版再 PATCH，不确定就先 `DELETE` 再重新建一条。
- 结尾附 https://blog.rooquiz.com/en/<slug>
- 开头就是观点或一个具体数字，不要「New blog post:」这种开场。
- 不用 hashtag，不用 emoji。语气与文章一致。
- 不要把标题原样复制过来——换一个角度说同一件事。

Typefully 返回非 2xx：重试一次。仍然失败就在汇报里贴出推文全文和错误，
让人工补发。**文章已经发布了，推文失败不要回滚文章。**

===== 第 7 步：汇报 =====
一段话说清：
- 热点页读到了没有，读到了的话本周热点是什么（读不到就写明原因）
- 发了哪篇、为什么选它、线上链接
- 封面用了谁的照片
- 有没有链模版，链了哪个（没链就说明为什么不贴题）
- 推文排在什么时间
- 遇到什么问题
```

## 在桌面端创建任务（拿到「Only on this computer」）

任务要在 Claude 桌面端里新建才会是本机任务（不上云、不在云端任务列表里）。
排期填**每周四 10:00**，挂上 `~/code/rooquiz/rooquiz-blog` 这个文件夹，
审批选自动。提示词粘下面这段——它只是个壳，真正的步骤仍然是本文件
「提示词正文」那一节，任务运行时自己去读，所以改那一节立刻生效。

```text
你是 RooQuiz 官方博客（blog.rooquiz.com）的内容维护者。本次运行要完成一件事：
从本周简报里挑一个最有价值的选题，发布一篇新的英文文章，然后排一条对应的 X 推文。
全程无人审核，直接上线。

===== 只在本机运行 =====
所有文件操作和接口调用都走本机。仓库 ~/code/rooquiz/rooquiz-blog 必须已挂给本任务，
读不到就立刻中止，汇报「仓库文件夹没挂上，本周跳过」——选题清单、简报、凭证都在里面。
不要重试，不要改用云端环境重建，更不要凭空造选题。

===== 完整规范 =====
详细步骤写在仓库里：docs/weekly-post-task-prompt.md 的「提示词正文」代码块
（第 0 步到第 7 步）。先完整读一遍那一节，然后严格照做。那份文档是唯一权威：
MDX 从 ## 开始、站内链接必须带 /en 前缀、封面选图先量亮度、必须用 CLUT 双色调写法、
Typefully 的 publish_at 只能用 next-free-slot 且推文排上去改不了——都是踩过坑写下来的。
文档更新了以它为准，不用回来改本任务。
同时读 docs/publishing-api.md 确认接口契约，读 CLAUDE.md 了解仓库约定。

===== 凭证 =====
三个密钥现读本机 ~/code/rooquiz/rooquiz-blog/.env.local，不要把值打印到汇报或日志里：
- BLOG_WRITE_TOKEN 缺失或为空 → 立刻中止，汇报「.env.local 缺 BLOG_WRITE_TOKEN」
- UNSPLASH_ACCESS_KEY 为空 → 跳过 Unsplash 检索，走文档里的纯色兜底封面
- TYPEFULLY_API_KEY 为空 → 照常发文，跳过排推文，在汇报里写明并附推文全文
Typefully social set id 固定为 328665（RooQuiz / X @rooquizteam）。

===== 选题 =====
docs/weekly-brief.md 由 LeadPilot 每周三覆盖式更新。简报「这周写哪一篇」的第一条
∩ docs/content-calendar.md 里尚未发布的候选，就是本周要写的那篇——它已经做完热度排序
和已发布排除，不要自己再比一遍。简报读不到就按清单顺序取第一个未发布的，并写明原因。
候选为空就汇报「选题清单已用尽，需要补充新的选题」然后结束，不要自己编选题。

内容要求丰富扎实：1200–1600 词，4–6 个 ## 小节，至少一个 Markdown 表格，具体数字、
可操作清单、真实场景例子。按文档「关联模版」那一节，贴题时链 1–2 个 RooQuiz 现成模版，
id 和标题只能用实际读到的、链前核状态码，不贴题就不链。绝对不要编造研究引用、
行业基准、客户数据或模版链接——编出来的数字会被人引用，编出来的链接是死链。

===== 汇报 =====
按文档第 7 步汇报：简报读到没有、发了哪篇、为什么选它、线上链接、封面用了谁的照片、
有没有链模版、推文排在什么时间、遇到什么问题。
```

建好本机任务后，记得把云端那个同名任务删掉，否则同一个周四会跑两遍。

## 已知的取舍

- **依赖你的电脑**。见上面「运行前提」。漏跑就是漏一期，任务不会补发。
- **简报可能是旧的**。它由 LeadPilot 每周三写，只比发文早一天。周三没开机就不会
  更新，周四读到的是上周那份——里面的证据链接还在，但「本周」二字要打折扣。
  简报第一行的日期是那一周的**周一**（不是它跑的那天），和本周对不上就在汇报里说一声。
- **简报里的模版选题没有和 RooQuiz 主模版库查重**（83 个模版在 berlin，
  LeadPilot 读不到）。那一节不影响发文，看看就好。
- **无人审核**。事实错误、错别字会直接上线。补救靠事后改：改 Supabase 的
  `posts` 行或重发同一个 slug（幂等，会覆盖），再调一次 `/api/deploy`。
- **推文是排期不是立即发**。X 不允许 API 直接发布带链接的推文，所以最快也只能排到
  文章上线后 20 分钟（见第 6 步）。想改这个间隔，直接改第 6 步里的分钟数——不用再去
  Typefully 调 posting schedule，那个只对 `"next-free-slot"` 生效，现在已经不走它了。
- **Typefully 有发布配额**。账号当前是每月 10 条（`publishing_quota`，每月 1 号
  重置）。每周一篇 = 每月 4–5 条，够用，但别再往同一个 social set 挂别的自动化。
- **双色调会吃掉照片细节**。靠颜色撑的照片处理完会糊，所以提示词里要求挑
  明暗层次清楚的。
- **只发英文**。`translationKey` 按 slug 填，将来补中文版直接用同一个 key。
