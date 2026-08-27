import Link from 'next/link'
import type { Locale } from '@config'

import { localePath, type PostMeta } from '@/lib/content'
import { formatDate, formatReadingTime } from '@/lib/format'

/**
 * 列表卡片。刻意不用 HeroUI 的 Card —— 它是 'use client'，
 * 列表页一屏十几张卡会把整份 react-aria 拖进首屏，而这里不需要任何交互。
 */
export function PostCard({ post, locale }: { post: PostMeta; locale: Locale }) {
  return (
    <article className="border-b border-[var(--border)] py-8 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--muted)]">
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
        <span aria-hidden>·</span>
        <span>{formatReadingTime(post.readingMinutes, locale)}</span>
      </div>

      <h2 className="mt-2 text-xl font-semibold tracking-tight">
        <Link href={localePath(locale, post.slug)} className="hover:text-[var(--accent)]">
          {post.title}
        </Link>
      </h2>

      {post.summary && <p className="mt-2 leading-relaxed text-[var(--muted)]">{post.summary}</p>}

      {post.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {post.tags.map(tag => (
            <li key={tag}>
              <Link
                href={localePath(locale, 'tags', tag)}
                className="inline-block rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {tag}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
