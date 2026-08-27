import { createHash } from 'node:crypto'

import readingTime from 'reading-time'
import matter from 'gray-matter'

import { site } from '@config'
import { isAuthorized, unauthorized } from '@/lib/api/auth'
import { triggerDeploy } from '@/lib/api/deploy'
import { postInputSchema } from '@/lib/api/schema'
import { postObjectPath } from '@/lib/content/paths'
import { BUCKET_CONTENT, supabaseAdmin } from '@/lib/supabase/admin'

/** 写入接口必须每次真跑，不能被静态化 */
export const dynamic = 'force-dynamic'

/**
 * 程序化发布文章。
 *
 *   POST /api/posts
 *   Authorization: Bearer $BLOG_WRITE_TOKEN
 *   { slug, locale, title, summary, tags, mdx, status, deploy, ... }
 *
 * 幂等：正文 hash 与元数据都没变时直接返回 { changed: false } 且不触发构建，
 * 这样 AI 重跑同一批文章不会把 Vercel 的构建队列刷爆。
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = postInputSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
  }

  const input = parsed.data
  const supabase = supabaseAdmin()
  const storagePath = postObjectPath(input.locale, input.slug)
  const contentHash = createHash('sha256').update(input.mdx).digest('hex')

  // 阅读时长在服务端算一次，写进索引；中文按字符估，reading-time 按词切会严重低估
  const mdxBody = matter(input.mdx).content
  const readingMinutes =
    input.locale === 'zh'
      ? Math.max(1, Math.round(mdxBody.replace(/\s+/g, '').length / 400))
      : Math.max(1, Math.round(readingTime(mdxBody).minutes))

  // 先读已有行：published_at 要拿它兜底，否则每次重发都会生成新时间戳、幂等永远判不成立
  const { data: existing, error: readError } = await supabase
    .from('posts')
    .select('id, content_hash, title, summary, cover_url, tags, author, status, translation_key, published_at')
    .eq('locale', input.locale)
    .eq('slug', input.slug)
    .maybeSingle<ExistingRow & { id: string; content_hash: string }>()

  if (readError) {
    return Response.json({ error: `Failed to read existing post: ${readError.message}` }, { status: 500 })
  }

  // 发布时间的优先级：调用方显式传入 > 库里已有 > 首次发布用当前时间
  const publishedAt =
    input.publishedAt ?? existing?.published_at ?? (input.status === 'published' ? new Date().toISOString() : null)

  const record = {
    slug: input.slug,
    locale: input.locale,
    translation_key: input.translationKey ?? input.slug,
    title: input.title,
    summary: input.summary,
    cover_url: input.coverUrl ?? null,
    tags: input.tags,
    author: input.author ?? site.defaultAuthor,
    status: input.status,
    storage_path: storagePath,
    content_hash: contentHash,
    reading_minutes: readingMinutes,
    published_at: publishedAt,
  }

  if (existing && existing.content_hash === contentHash && isMetadataUnchanged(existing, record)) {
    return Response.json({ changed: false, slug: input.slug, locale: input.locale, deploy: { triggered: false } })
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_CONTENT)
    .upload(storagePath, new Blob([input.mdx], { type: 'text/markdown' }), {
      upsert: true,
      contentType: 'text/markdown; charset=utf-8',
    })

  if (uploadError) {
    return Response.json({ error: `Failed to upload MDX: ${uploadError.message}` }, { status: 502 })
  }

  const { error: upsertError } = await supabase.from('posts').upsert(record, { onConflict: 'locale,slug' })

  if (upsertError) {
    return Response.json({ error: `Failed to upsert post: ${upsertError.message}` }, { status: 500 })
  }

  // 只有已发布的内容变化才值得重建；草稿改动不影响线上产物
  const affectsLiveSite = input.status === 'published' || existing?.status === 'published'
  const deploy = !input.deploy
    ? { triggered: false, reason: 'deploy:false requested by caller' }
    : !affectsLiveSite
      ? { triggered: false, reason: 'draft-only change, nothing to rebuild' }
      : await triggerDeploy()

  return Response.json({
    changed: true,
    created: !existing,
    slug: input.slug,
    locale: input.locale,
    storagePath,
    contentHash,
    readingMinutes,
    deploy,
  })
}

interface ExistingRow {
  title: string
  summary: string | null
  cover_url: string | null
  tags: string[] | null
  author: string | null
  status: string
  translation_key: string
  published_at: string | null
}

/** 只比会影响静态产物的字段；storage_path / content_hash 另行比对 */
function isMetadataUnchanged(existing: ExistingRow, next: ExistingRow): boolean {
  return (
    existing.title === next.title &&
    (existing.summary ?? '') === (next.summary ?? '') &&
    existing.cover_url === next.cover_url &&
    (existing.author ?? '') === (next.author ?? '') &&
    existing.status === next.status &&
    existing.translation_key === next.translation_key &&
    existing.published_at === next.published_at &&
    JSON.stringify(existing.tags ?? []) === JSON.stringify(next.tags ?? [])
  )
}
