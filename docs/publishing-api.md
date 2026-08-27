# 发布 API

博客没有后台界面，文章一律通过 HTTP 接口写入。三个端点都用同一个 Bearer token
（环境变量 `BLOG_WRITE_TOKEN`）鉴权。

生产地址 `https://blog.rooquiz.com`，本地 `http://localhost:8200`。

---

## `POST /api/posts` — 写入一篇文章

把 MDX 正文上传到 Supabase Storage（`blog-content`，private），并 upsert `posts` 表的索引行。

```bash
curl -X POST https://blog.rooquiz.com/api/posts \
  -H "Authorization: Bearer $BLOG_WRITE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d @docs/examples/post.json
```

### 字段

| 字段             | 类型                                 | 必填 | 说明                                                                                                                         |
| ---------------- | ------------------------------------ | ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| `slug`           | string                               | ✅   | 小写字母、数字、单连字符。不能撞保留字（`tags` / `page` / `search` / `feed.xml` …），见 `site.config.ts` 的 `RESERVED_SLUGS` |
| `locale`         | `"en"` \| `"zh"`                     | ✅   |                                                                                                                              |
| `title`          | string                               | ✅   | ≤ 300 字符                                                                                                                   |
| `mdx`            | string                               | ✅   | MDX 全文。带不带 frontmatter 都行，索引以本请求的字段为准                                                                    |
| `translationKey` | string                               |      | 同一篇文章跨语言的分组键，驱动 hreflang 互链。**不传就退化成 slug**，中英文各成一篇、互不关联                                |
| `summary`        | string                               |      | ≤ 600 字符，用于列表页、OG 图、RSS                                                                                           |
| `tags`           | string[]                             |      | 最多 10 个                                                                                                                   |
| `coverUrl`       | url                                  |      |                                                                                                                              |
| `author`         | string                               |      | 默认 `RooQuiz Team`                                                                                                          |
| `status`         | `draft` \| `published` \| `archived` |      | 默认 `draft`。只有 `published` 会进入构建                                                                                    |
| `publishedAt`    | ISO 8601                             |      | 不传时：库里已有就沿用旧值，首次发布用当前时间                                                                               |
| `deploy`         | boolean                              |      | 默认 `true`。**批量写入务必传 `false`**                                                                                      |

### 响应

```jsonc
// 内容有变化
{ "changed": true, "created": false, "slug": "...", "locale": "en",
  "storagePath": "posts/en/....mdx", "contentHash": "…", "readingMinutes": 6,
  "deploy": { "triggered": true } }

// 幂等短路：正文 hash 与全部元数据都没变
{ "changed": false, "slug": "...", "locale": "en", "deploy": { "triggered": false } }
```

幂等是刻意设计的：AI 重跑同一批文章不会反复触发 Vercel 构建。

### 状态码

| 码        | 含义                                                  |
| --------- | ----------------------------------------------------- |
| 200       | 成功（含幂等短路）                                    |
| 400       | JSON 解析失败，或 zod 校验不通过（响应体带 `issues`） |
| 401       | token 缺失或不匹配                                    |
| 500 / 502 | 数据库或 Storage 出错                                 |

---

## `POST /api/deploy` — 触发一次构建

```bash
curl -X POST https://blog.rooquiz.com/api/deploy \
  -H "Authorization: Bearer $BLOG_WRITE_TOKEN"
```

返回 `202 { "triggered": true }`，或 `503` 带 `reason`。

---

## `POST /api/media/upload-url` — 签发配图上传地址

图片不经过本服务转发（避开 Vercel 函数的 body 体积与超时限制），改为签发一次性上传 URL。

```bash
curl -X POST https://blog.rooquiz.com/api/media/upload-url \
  -H "Authorization: Bearer $BLOG_WRITE_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"translationKey":"result-pages","filename":"funnel-diagram.webp"}'
```

响应：

```json
{
  "uploadUrl": "https://<ref>.supabase.co/storage/v1/object/upload/sign/blog-media/...",
  "token": "…",
  "objectPath": "images/result-pages/funnel-diagram.webp",
  "publicUrl": "https://<ref>.supabase.co/storage/v1/object/public/blog-media/images/result-pages/funnel-diagram.webp"
}
```

拿 `uploadUrl` 发 `PUT`（body 是文件二进制），成功后在 MDX 里引用 `publicUrl`。
文件名只接受 `webp/png/jpg/jpeg/gif/svg`。

---

## 批量写入的推荐顺序

```
for each post:
    POST /api/posts   { ..., "deploy": false }
POST /api/deploy                      # 全部写完后触发一次
```

逐篇带 `deploy: true` 会给每篇文章都排一次 Vercel 构建。

---

## 发布之后

构建会跑 `pnpm sync`：从 `posts` 表拉出 `status = 'published'` 的行，
按 `content_hash` 增量下载 MDX 到 `.content/`，再由 `next build` 全量预渲染。
线上生效时间 = 一次 Vercel 构建的时长。

草稿要下线或改状态，直接在 Supabase Dashboard 改 `posts.status` 即可，
下次构建就会生效（改完记得调一次 `/api/deploy`）。
