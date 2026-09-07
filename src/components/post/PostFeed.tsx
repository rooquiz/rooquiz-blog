import Link from 'next/link'
import type { Locale } from '@config'

import { localePath, type PostMeta } from '@/lib/content'
import { formatDate, formatReadingTime } from '@/lib/format'
import { t } from '@/lib/i18n'
import { ArrowRightIcon } from '@/components/layout/Icons'

/**
 * 首页 / 分页页的文章流。
 *
 * 文章列表保持纯文字、单一节奏。封面图留给文章页：在索引页里，标题、摘要和
 * 阅读时间才是最有效的扫描线索，也更接近一份真正的编辑型技术刊物。
 */
export function PostFeed({
  posts,
  locale,
}: {
  posts: PostMeta[]
  locale: Locale
}) {
  const copy = t(locale)

  if (posts.length === 0) {
    return <p className="page__empty">{copy.empty}</p>
  }

  return (
    <ol className="feed">
      {posts.map(post => (
        <FeedItem key={post.slug} post={post} locale={locale} />
      ))}
    </ol>
  )
}

function FeedItem({ post, locale }: { post: PostMeta; locale: Locale }) {
  const copy = t(locale)
  const href = localePath(locale, post.slug)

  return (
    <li className="feed__item">
      <article>
        <h2 className="u-h2 feed__title">
          <Link href={href}>{post.title}</Link>
        </h2>

        <p className="u-meta feed__meta">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
          <span>{formatReadingTime(post.readingMinutes, locale)}</span>
        </p>

        {post.summary && <p className="feed__summary">{post.summary}</p>}

        <div className="feed__foot">
          <Link href={href} className="u-more">
            {copy.readMore}
            <ArrowRightIcon />
          </Link>
          {post.tags[0] && (
            <Link href={localePath(locale, 'tags', post.tags[0])} className="chip">
              {post.tags[0]}
            </Link>
          )}
        </div>
      </article>
    </li>
  )
}
