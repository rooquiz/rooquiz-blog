/**
 * 构建前置同步：把 Supabase 上的已发布文章拉到本地 .content/，供 next build 读取。
 *
 * 为什么要落地成文件，而不是在页面里直接查 Supabase：
 *   - 同一篇文章会被列表页、详情页、OG 图、feed、搜索索引反复读，落地一次省掉 N 次网络往返
 *   - 构建产物可复现，且 next build 期间不依赖网络抖动
 *   - 运行时因此零 Supabase 依赖，符合「纯 SSG」的目标
 *
 * 没配 Supabase 环境变量时回落到 content/_samples/，保证 `pnpm dev` 离线可用。
 *
 * 用法：pnpm sync（`pnpm build` 会先跑它）
 */
import fs from 'node:fs/promises'
import path from 'node:path'

import { createClient } from '@supabase/supabase-js'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import 'dotenv/config'

import { DEFAULT_LOCALE, LOCALES, site, type Locale } from '../site.config.ts'
import type { ContentIndex, PostMeta } from '../src/lib/content/types.ts'

const CONTENT_DIR = path.join(process.cwd(), '.content')
const INDEX_FILE = path.join(CONTENT_DIR, 'index.json')
const MANIFEST_FILE = path.join(CONTENT_DIR, 'manifest.json')
const SAMPLES_DIR = path.join(process.cwd(), 'content', '_samples')
const BUCKET_CONTENT = 'blog-content'

/** slug → 上次同步时的 content_hash，用来跳过没变的文件 */
type Manifest = Record<string, string>

function log(message: string) {
  console.log(`[sync-content] ${message}`)
}

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

async function readManifest(): Promise<Manifest> {
  try {
    return JSON.parse(await fs.readFile(MANIFEST_FILE, 'utf8')) as Manifest
  } catch {
    return {}
  }
}

async function writeFileEnsured(filePath: string, contents: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, contents, 'utf8')
}

/** 正文行数 → 阅读分钟数。中文按字符估，reading-time 默认按词，对中文会严重低估。 */
function estimateReadingMinutes(body: string, locale: Locale): number {
  if (locale === 'zh') {
    const chars = body.replace(/\s+/g, '').length
    return Math.max(1, Math.round(chars / 400))
  }
  return Math.max(1, Math.round(readingTime(body).minutes))
}

// ---------------------------------------------------------------------------
// 来源一：Supabase
// ---------------------------------------------------------------------------

interface PostRow {
  slug: string
  locale: string
  translation_key: string
  title: string
  summary: string | null
  cover_url: string | null
  tags: string[] | null
  author: string | null
  storage_path: string
  content_hash: string
  reading_minutes: number | null
  published_at: string | null
}

async function syncFromSupabase(): Promise<ContentIndex> {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase
    .from('posts')
    .select(
      'slug, locale, translation_key, title, summary, cover_url, tags, author, storage_path, content_hash, reading_minutes, published_at',
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .returns<PostRow[]>()

  if (error) throw new Error(`Failed to query posts: ${error.message}`)

  const rows = data ?? []
  log(`${rows.length} published post(s) in Postgres`)

  const previous = await readManifest()
  const manifest: Manifest = {}
  const posts: PostMeta[] = []
  let downloaded = 0
  let skipped = 0

  for (const row of rows) {
    if (!isLocale(row.locale)) {
      log(`  ! skip ${row.storage_path}: unknown locale "${row.locale}"`)
      continue
    }

    const localPath = path.join(CONTENT_DIR, row.storage_path)
    const unchanged = previous[row.storage_path] === row.content_hash

    if (unchanged && (await fileExists(localPath))) {
      skipped++
    } else {
      const { data: blob, error: downloadError } = await supabase.storage
        .from(BUCKET_CONTENT)
        .download(row.storage_path)

      if (downloadError || !blob) {
        throw new Error(`Failed to download ${row.storage_path}: ${downloadError?.message ?? 'empty body'}`)
      }

      await writeFileEnsured(localPath, await blob.text())
      downloaded++
    }

    manifest[row.storage_path] = row.content_hash

    const body = matter(await fs.readFile(localPath, 'utf8')).content
    posts.push({
      slug: row.slug,
      locale: row.locale,
      translationKey: row.translation_key,
      title: row.title,
      summary: row.summary ?? '',
      coverUrl: row.cover_url,
      tags: row.tags ?? [],
      author: row.author ?? site.defaultAuthor,
      publishedAt: row.published_at ?? new Date(0).toISOString(),
      readingMinutes: row.reading_minutes ?? estimateReadingMinutes(body, row.locale),
      contentPath: row.storage_path,
    })
  }

  log(`downloaded ${downloaded}, skipped ${skipped} unchanged`)
  await writeFileEnsured(MANIFEST_FILE, JSON.stringify(manifest, null, 2))

  return { generatedAt: new Date().toISOString(), source: 'supabase', posts }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// 来源二：本地样例（离线回落）
// ---------------------------------------------------------------------------

async function syncFromSamples(): Promise<ContentIndex> {
  const posts: PostMeta[] = []

  for (const locale of LOCALES) {
    const dir = path.join(SAMPLES_DIR, locale)
    let entries: string[]
    try {
      entries = await fs.readdir(dir)
    } catch {
      continue
    }

    for (const entry of entries) {
      if (!entry.endsWith('.mdx')) continue

      const slug = entry.replace(/\.mdx$/, '')
      const raw = await fs.readFile(path.join(dir, entry), 'utf8')
      const { data: frontmatter, content: body } = matter(raw)
      const storagePath = `posts/${locale}/${slug}.mdx`

      await writeFileEnsured(path.join(CONTENT_DIR, storagePath), raw)

      posts.push({
        slug,
        locale,
        translationKey: String(frontmatter.translationKey ?? slug),
        title: String(frontmatter.title ?? slug),
        summary: String(frontmatter.summary ?? ''),
        coverUrl: frontmatter.coverUrl ? String(frontmatter.coverUrl) : null,
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
        author: String(frontmatter.author ?? site.defaultAuthor),
        publishedAt: frontmatter.publishedAt
          ? new Date(frontmatter.publishedAt).toISOString()
          : new Date(0).toISOString(),
        readingMinutes: estimateReadingMinutes(body, locale),
        contentPath: storagePath,
      })
    }
  }

  posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  await writeFileEnsured(MANIFEST_FILE, JSON.stringify({}, null, 2))

  return { generatedAt: new Date().toISOString(), source: 'samples', posts }
}

// ---------------------------------------------------------------------------
// 搜索索引：构建期投影，客户端 MiniSearch 直接吃
// ---------------------------------------------------------------------------

async function writeSearchIndexes(index: ContentIndex) {
  for (const locale of LOCALES) {
    const docs = index.posts
      .filter(post => post.locale === locale)
      .map(post => ({
        id: post.slug,
        title: post.title,
        summary: post.summary,
        tags: post.tags.join(' '),
        publishedAt: post.publishedAt,
      }))

    const target = path.join(process.cwd(), 'public', `search-index-${locale}.json`)
    await writeFileEnsured(target, JSON.stringify(docs))
    log(`search index ${locale}: ${docs.length} doc(s)`)
  }
}

// ---------------------------------------------------------------------------

async function main() {
  await fs.rm(path.join(CONTENT_DIR, 'posts'), { recursive: true, force: true }).catch(() => {})

  const hasCredentials = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (!hasCredentials) {
    log('!'.repeat(60))
    log('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set —— 回落到 content/_samples/')
    log('这只适合本地开发。生产构建缺 key 会产出一个只有样例文章的站。')
    log('!'.repeat(60))
  }

  const index = hasCredentials ? await syncFromSupabase() : await syncFromSamples()

  // sha256 存进索引，页面层不需要，但排查「线上内容和库里对不上」时很有用
  await writeFileEnsured(INDEX_FILE, JSON.stringify(index, null, 2))
  await writeSearchIndexes(index)

  const byLocale = LOCALES.map(l => `${l}=${index.posts.filter(p => p.locale === l).length}`).join(' ')
  log(`done · source=${index.source} · ${byLocale} · default locale=${DEFAULT_LOCALE}`)
}

main().catch(error => {
  console.error(`[sync-content] FAILED: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
