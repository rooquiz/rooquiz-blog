# 自动化发文：AI Agent 与 n8n 接入指南

[`publishing-api.md`](./publishing-api.md) 是接口契约，这份是**调用方怎么驱动它**。
可执行参考实现在 [`scripts/publish-example.mts`](../scripts/publish-example.mts)（`pnpm publish:example`）。

---

## 1. 心智模型

对调用方来说，发一篇文章就是**两类资源各写一次**：

```
（可选）图片  ──▶ POST /api/media/upload-url  ──▶  PUT 到签出来的地址
                                                        │
                                                        ▼ publicUrl
              正文 + 元数据  ──▶  POST /api/posts  ◀────┘
                                        │
                                        ▼（批量时延后）
                                POST /api/deploy
```

三个要点，先记住能省很多调试：

1. **写入不等于上线。** `POST /api/posts` 只是把内容写进 Supabase。线上是构建期产物，
   必须有一次 Vercel 构建（Deploy Hook）才会出现。
2. **图片不经过本服务。** 我们只签发地址，文件由调用方直接 PUT 给 Supabase，
   这样绕开了 serverless 的 body 体积与超时限制。
3. **写入是幂等的。** 正文 hash 与全部元数据都没变时返回 `{ "changed": false }` 且不触发构建。
   重试、重跑、定时任务重复执行都安全。

---

## 2. 前置

| 需要什么           | 从哪来                                                        |
| ------------------ | ------------------------------------------------------------- |
| `BLOG_API_BASE`    | 生产 `https://blog.rooquiz.com`；本地 `http://localhost:8200` |
| `BLOG_WRITE_TOKEN` | Vercel 环境变量里那个（Sensitive）。三个写入端点共用          |

所有写入请求都带同一个头：

```
Authorization: Bearer <BLOG_WRITE_TOKEN>
Content-Type: application/json
```

---

## 3. 生成内容必须遵守的约定

**这一节是给写 prompt 的人看的。** LLM 生成内容时最容易错的就是这几条，
建议整段抄进 system prompt。

### slug

- 只能是小写字母、数字、单个连字符：`^[a-z0-9]+(?:-[a-z0-9]+)*$`
- 不能是保留字：`tags` `page` `search` `feed.xml` `rss.xml` `sitemap.xml`
  `robots.txt` `about` `api` `opengraph-image` `kitchen-sink`
- 最长 120 字符
- **中文文章的 slug 也要用英文**——URL 里的中文会被百分号编码，又长又不可读

违反规则返回 400，响应体的 `issues` 数组会指明是哪条。

### 双语与 `translationKey`

同一篇文章的中英文版本，**必须传相同的 `translationKey`**，这是 hreflang 互链的唯一依据。

```jsonc
{ "slug": "quiz-funnel-basics",   "locale": "en", "translationKey": "quiz-funnel-basics" }
{ "slug": "quiz-funnel-jichu",    "locale": "zh", "translationKey": "quiz-funnel-basics" }
```

不传 `translationKey` 会退化成用 slug，此时两个语言版本互不关联，
搜索引擎会当成两篇无关文章。两条 slug 不同却想互链时，这个字段就是唯一的桥。

### MDX 正文

- **frontmatter 可有可无**。索引以请求里的 `title` / `summary` / `tags` 字段为准，
  正文里的 frontmatter 不参与渲染，也不会覆盖它们。
- **站内链接必须自带 locale 前缀**：写 `/en/other-post`，不能写 `/other-post`。
  系统不会自动补全——补错了比 404 更难查。
- **图片引用上一步返回的 `publicUrl`**，别自己拼路径。只有匹配
  `NEXT_PUBLIC_MEDIA_BASE_URL` 前缀的图片才会走 `next/image` 优化。
- 支持 GFM：表格、任务列表、删除线。代码围栏要标语言才有高亮（` ```ts `）。
- **标题从 `##` 开始**。`#` 留给文章标题，它由页面自己渲染，正文里再写一个 h1
  会出现两个 h1，同时破坏 JSON-LD 的 headline 与可见 H1 一致性。
- 文章有 3 个及以上 `##` / `###` 时会自动生成目录，不需要手写。

### 其它字段

| 字段          | 约束                                 | 说明                                                       |
| ------------- | ------------------------------------ | ---------------------------------------------------------- |
| `title`       | ≤ 300                                |                                                            |
| `summary`     | ≤ 600                                | 列表页、RSS、OG 图都用它。**别留空**，留空的 OG 图只有标题 |
| `tags`        | ≤ 10 个，每个 ≤ 50                   | 小写连字符风格，会直接变成 `/[locale]/tags/<tag>` 路径     |
| `status`      | `draft` \| `published` \| `archived` | 默认 `draft`。**只有 `published` 会进构建**                |
| `publishedAt` | ISO 8601                             | 不传时：库里已有就沿用，首次发布用当前时间                 |

---

## 4. AI Agent 接入

### 给 LLM 的工具定义

直接对应 `src/lib/api/schema.ts` 的 zod schema：

```json
{
  "name": "publish_blog_post",
  "description": "Publish or update an article on blog.rooquiz.com. Idempotent: re-sending identical content is a no-op.",
  "input_schema": {
    "type": "object",
    "required": ["slug", "locale", "title", "mdx"],
    "properties": {
      "slug": {
        "type": "string",
        "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$",
        "maxLength": 120,
        "description": "URL slug. Lowercase letters, digits, single hyphens. Must not be one of: tags, page, search, feed.xml, rss.xml, sitemap.xml, robots.txt, about, api, opengraph-image, kitchen-sink. Use English even for Chinese articles."
      },
      "locale": { "type": "string", "enum": ["en", "zh"] },
      "translationKey": {
        "type": "string",
        "maxLength": 120,
        "description": "Shared key linking the en and zh versions of the same article. Required whenever a translation exists or may exist later."
      },
      "title": { "type": "string", "maxLength": 300 },
      "summary": {
        "type": "string",
        "maxLength": 600,
        "description": "Used in the listing, RSS and the generated OG image. Do not leave empty."
      },
      "tags": { "type": "array", "items": { "type": "string", "maxLength": 50 }, "maxItems": 10 },
      "coverUrl": { "type": "string", "format": "uri" },
      "author": { "type": "string", "maxLength": 120 },
      "status": { "type": "string", "enum": ["draft", "published", "archived"], "default": "draft" },
      "publishedAt": { "type": "string", "format": "date-time" },
      "mdx": {
        "type": "string",
        "description": "Full MDX body. Start headings at '##'. Internal links must carry the locale prefix (/en/... or /zh/...). Reference images by the publicUrl returned from the media upload step."
      },
      "deploy": {
        "type": "boolean",
        "default": true,
        "description": "Set false when writing a batch, then call the deploy endpoint once at the end."
      }
    }
  }
}
```

### 建议的 agent 循环

```
1. 选题、写正文（遵守第 3 节的约定）
2. 需要配图 → 生成图 → 调 upload_blog_image 拿 publicUrl → 把 URL 插进 MDX
3. 调 publish_blog_post，status="published"，deploy=false
4. 一批写完 → 调 trigger_blog_deploy 一次
5. 检查返回：changed=true 表示确有写入；changed=false 表示内容与库里完全一致
```

**让 agent 先发 `draft`。** 需要人过一眼的场景下，用 `status: "draft"` 写入，
人工在 Supabase Dashboard 里把 `status` 改成 `published`，再调一次 `/api/deploy`。
草稿不进构建，不会漏到线上。

---

## 5. n8n 接入

### 单篇发布（3 个 HTTP Request 节点）

先在 n8n 里建两个 **Credential**（或用环境变量），避免 token 散落在节点里：
`BLOG_API_BASE`、`BLOG_WRITE_TOKEN`。

**节点 1 —— 签发上传地址**

| 配置项         | 值                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------- |
| Method         | `POST`                                                                                   |
| URL            | `{{ $env.BLOG_API_BASE }}/api/media/upload-url`                                          |
| Authentication | Generic → Header Auth，Name `Authorization`，Value `Bearer {{ $env.BLOG_WRITE_TOKEN }}`  |
| Send Body      | on，JSON                                                                                 |
| Body           | `{ "translationKey": "{{ $json.translationKey }}", "filename": "{{ $json.filename }}" }` |

返回里取 `uploadUrl`、`publicUrl`、`objectPath`。

**节点 2 —— 上传图片**

| 配置项                | 值                                              |
| --------------------- | ----------------------------------------------- |
| Method                | `PUT`                                           |
| URL                   | `{{ $json.uploadUrl }}`                         |
| Send Body             | on，**Body Content Type = n8n Binary File**     |
| Input Data Field Name | `data`（上游 Read/Download 节点的二进制字段名） |
| Header                | `Content-Type: image/webp`（按实际类型改）      |

注意这个节点**不要带 Authorization 头**——签名已经在 URL 里了，多带一个反而可能被拒。

**节点 3 —— 写入文章**

| 配置项         | 值                                   |
| -------------- | ------------------------------------ |
| Method         | `POST`                               |
| URL            | `{{ $env.BLOG_API_BASE }}/api/posts` |
| Authentication | 同节点 1                             |
| Body           | 见下                                 |

```
={{ JSON.stringify({
  slug: $('Prepare').item.json.slug,
  locale: 'en',
  translationKey: $('Prepare').item.json.translationKey,
  title: $('Prepare').item.json.title,
  summary: $('Prepare').item.json.summary,
  tags: $('Prepare').item.json.tags,
  status: 'published',
  mdx: $('Prepare').item.json.mdx,
  deploy: false
}) }}
```

**节点 4 —— 触发构建**（放在循环之外）

| 配置项         | 值                                    |
| -------------- | ------------------------------------- |
| Method         | `POST`                                |
| URL            | `{{ $env.BLOG_API_BASE }}/api/deploy` |
| Authentication | 同节点 1                              |

### 批量发布的节点编排

```
Schedule Trigger
      ▼
[取选题列表]           ← Google Sheets / Notion / Postgres 都行
      ▼
Split In Batches ──────────────┐
      ▼                        │
[AI Agent 写正文]              │
      ▼                        │
[签发上传地址] → [PUT 图片]    │  每篇 deploy: false
      ▼                        │
[POST /api/posts]              │
      ▼                        │
      └────────────────────────┘ 回到 Split In Batches
      ▼ (全部批次完成)
[POST /api/deploy]              ← 只调一次
```

**Split In Batches 的 Batch Size 建议设 1**，配合节点的 Retry On Fail。
写入是幂等的，重试不会产生重复文章。

### 错误处理

在 HTTP Request 节点打开 **Always Output Data** + **Continue On Fail**，
然后接一个 IF 节点判断 `$json.error`：

| 状态码    | 含义                  | 该怎么办                                                       |
| --------- | --------------------- | -------------------------------------------------------------- |
| 400       | 校验不通过            | 看 `issues` 数组。**不要重试**，内容本身有问题，要回到生成环节 |
| 401       | token 不对            | 检查 `BLOG_WRITE_TOKEN` 与 Vercel 上的是否一致                 |
| 500 / 502 | 数据库或 Storage 出错 | 可以重试，幂等保证安全                                         |

---

## 6. 批量写入为什么必须 `deploy: false`

每次 `deploy: true` 都会打一次 Vercel Deploy Hook。写 20 篇就是 20 次构建请求，
Vercel 会排队串行执行，前 19 次的产物立刻被下一次覆盖——纯浪费构建时长。

正确做法：

```
for each post:  POST /api/posts  { ..., "deploy": false }
最后一次:        POST /api/deploy
```

单篇发布时 `deploy` 保持默认 `true` 就行。

---

## 7. 幂等语义（重试前必读）

`POST /api/posts` 在**正文 sha256 与全部元数据都没变**时短路返回：

```json
{ "changed": false, "slug": "...", "locale": "en", "deploy": { "triggered": false } }
```

「全部元数据」指：`title` `summary` `cover_url` `tags` `author` `status`
`translation_key` `published_at`。任意一个变了就会真写一次。

因此：

- 定时任务重复跑同一批内容 → 全部 `changed: false`，不触发构建
- 网络超时后重试 → 安全，最多重复写一次相同内容
- **`publishedAt` 不传时会沿用库里已有的值**，所以重发不会把发布时间刷成当前时间

---

## 8. 发布之后

构建流程：

```
Deploy Hook → Vercel Build
                ├ pnpm sync   拉 posts 表 + 从 Storage 下载 MDX 到 .content/
                └ next build  全站预渲染（页面 / OG 图 / sitemap / RSS / 搜索索引）
```

线上生效时间 = 一次构建的时长。

**下线或改状态**：在 Supabase Dashboard 改 `posts.status`，再调一次 `/api/deploy`。
改成 `draft` 或 `archived` 后，下次构建产物里就没有这篇了。

**删除文章**：删 `posts` 表对应行，并清掉 Storage 里
`blog-content/posts/{locale}/{slug}.mdx` 与 `blog-media/images/{translationKey}/` 下的图，
然后触发构建。

---

## 9. 常见坑

| 现象                           | 原因                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| 接口返回 200 但线上没有        | 没触发构建。调 `POST /api/deploy`                                                                      |
| 线上只有样例文章               | Vercel 构建期缺 `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`，`pnpm sync` 回落到了 `content/_samples/` |
| 图片 404                       | `blog-media` 不是 public bucket，或引用的 URL 与 `NEXT_PUBLIC_MEDIA_BASE_URL` 前缀不一致               |
| 图片显示但没走优化             | 同上，前缀不匹配就会退回原生 `<img>`                                                                   |
| 中英文没有互链                 | 两条记录的 `translationKey` 不一致，或压根没传                                                         |
| 站内链接 404                   | MDX 里的链接漏了 locale 前缀                                                                           |
| 文章页出现两个标题             | 正文里写了 `#` 一级标题。改成从 `##` 开始                                                              |
| 重发同样内容却 `changed: true` | 某个元数据字段变了，多半是 `publishedAt` 每次都传了当前时间                                            |
