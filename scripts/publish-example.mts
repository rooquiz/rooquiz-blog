/**
 * 发布链路的端到端参考实现：签发上传地址 → PUT 图片 → 写文章。
 * docs/publishing-api.md 描述的就是这三步，这里是可跑版本。
 *
 * 用法：
 *   pnpm publish:example                       # 打本地 http://localhost:8200
 *   BLOG_API_BASE=https://blog.rooquiz.com pnpm publish:example
 *   IMAGE=/path/to/pic.webp pnpm publish:example
 *
 * 需要的环境变量（放 .env.local）：
 *   BLOG_WRITE_TOKEN   —— 必需
 *   BLOG_API_BASE      —— 可选，默认 http://localhost:8200
 *
 * 注意：打生产地址就是真的往生产库写。slug 固定带 hello- 前缀，方便回收。
 */
import fs from 'node:fs/promises'
import path from 'node:path'

import dotenv from 'dotenv'

dotenv.config({ path: ['.env.local', '.env'], quiet: true })

const BASE = (process.env.BLOG_API_BASE ?? 'http://localhost:8200').replace(/\/$/, '')
const TOKEN = process.env.BLOG_WRITE_TOKEN
const IMAGE = process.env.IMAGE

const SLUG = 'hello-quiz-funnel-leaks'
const TRANSLATION_KEY = 'hello-quiz-funnel-leaks'

if (!TOKEN) {
  console.error('缺 BLOG_WRITE_TOKEN。把它写进 .env.local 再跑。')
  process.exit(1)
}

const auth = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }

async function step<T>(label: string, run: () => Promise<T>): Promise<T> {
  process.stdout.write(`▸ ${label} … `)
  try {
    const result = await run()
    console.log('ok')
    return result
  } catch (error) {
    console.log('FAILED')
    throw error
  }
}

async function expectJson(response: Response, what: string): Promise<Record<string, unknown>> {
  const text = await response.text()
  if (!response.ok) throw new Error(`${what}: HTTP ${response.status} — ${text.slice(0, 400)}`)
  return JSON.parse(text) as Record<string, unknown>
}

/** 1. 签发上传地址 */
async function signUpload(filename: string) {
  const response = await fetch(`${BASE}/api/media/upload-url`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ translationKey: TRANSLATION_KEY, filename }),
  })
  return expectJson(response, 'sign upload url')
}

/** 2. 把图片 PUT 到签出来的地址。文件不经过我们的函数，避开 body 体积与超时限制。 */
async function uploadImage(uploadUrl: string, filePath: string) {
  const body = await fs.readFile(filePath)
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/webp' },
    body: new Uint8Array(body),
  })
  if (!response.ok) throw new Error(`upload image: HTTP ${response.status} — ${(await response.text()).slice(0, 400)}`)
}

/** 3. 写文章 */
async function publishPost(coverUrl: string | null, imageUrl: string | null) {
  const figure = imageUrl
    ? `\n![Completion rate by funnel stage](${imageUrl})\n\n*每一级的完成率。钱几乎全漏在最后一格。*\n`
    : ''

  const mdx = `---
title: Hello from the publishing API
---

这篇文章不是手写进仓库的，是通过 \`POST /api/posts\` 写进 Supabase 的——
用来验证「程序化写入 → 构建期同步 → 静态产物」这条链路真的通。

## 它验证了什么

- MDX 正文落进 \`blog-content\`（private bucket）
- 元数据落进 Postgres 的 \`posts\` 表
- 配图落进 \`blog-media\`（public bucket），并在正文里被引用
- 构建期 \`pnpm sync\` 把两边拉回本地，\`next build\` 预渲染成静态页
${figure}
## 漏斗每一级的流失

| 环节 | 典型流失 | 通常原因 |
| --- | --- | --- |
| 进入 → 第 1 题 | 20–30% | 标题承诺了一个分类，而不是一个洞察 |
| 第 1 题 → 最后一题 | 15–25% | 题目太多，且没有进度提示 |
| 结果 → CTA | 50%+ | 结果泛泛，后续动作又和它无关 |

## 代码高亮也要验一下

\`\`\`ts
// 幂等：同一份内容重发不会触发多余构建
const contentHash = createHash('sha256').update(mdx).digest('hex')
if (existing?.content_hash === contentHash) return { changed: false }
\`\`\`

> 确认无误后，去 Supabase Dashboard 把这一行从 \`posts\` 表删掉即可。
`

  const response = await fetch(`${BASE}/api/posts`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      slug: SLUG,
      locale: 'en',
      translationKey: TRANSLATION_KEY,
      title: 'Hello from the publishing API',
      summary: '一篇通过 HTTP 接口写入的测试文章，用来验证 Storage、Postgres、配图与构建期同步这条完整链路。',
      tags: ['test', 'quiz-design'],
      coverUrl: coverUrl ?? undefined,
      author: 'RooQuiz Team',
      status: 'published',
      mdx,
      // 先不触发构建，最后统一调一次 /api/deploy
      deploy: false,
    }),
  })
  return expectJson(response, 'publish post')
}

async function main() {
  console.log(`target: ${BASE}\n`)

  let imageUrl: string | null = null

  if (IMAGE) {
    const filename = path.basename(IMAGE)
    const signed = await step('签发上传地址', () => signUpload(filename))
    await step('上传图片', () => uploadImage(String(signed.uploadUrl), IMAGE))
    imageUrl = signed.publicUrl ? String(signed.publicUrl) : null
    console.log(`  objectPath: ${String(signed.objectPath)}`)
    console.log(`  publicUrl : ${imageUrl ?? '(NEXT_PUBLIC_MEDIA_BASE_URL 未配置)'}\n`)
  } else {
    console.log('(未指定 IMAGE，跳过图片步骤)\n')
  }

  const first = await step('写入文章', () => publishPost(imageUrl, imageUrl))
  console.log(`  ${JSON.stringify(first)}\n`)

  // 同一份内容再发一次，验证幂等短路
  const second = await step('重复写入（验幂等）', () => publishPost(imageUrl, imageUrl))
  console.log(
    `  changed=${String(second.changed)}  ${second.changed === false ? '✓ 幂等生效' : '✗ 期望 changed=false'}\n`,
  )

  console.log(`完成。文章地址：${BASE}/en/${SLUG}`)
  console.log('构建后才可见 —— 本地跑 `pnpm build && pnpm start`，线上调 POST /api/deploy。')
}

main().catch(error => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
