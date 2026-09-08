import Link from 'next/link'
import type { Locale } from '@config'

import { localePath, type PostMeta } from '@/lib/content'
import { formatDate, formatReadingTime } from '@/lib/format'
import { t } from '@/lib/i18n'
import { ArrowRightIcon } from '@/components/layout/Icons'

/**
 * 首页头条：最新那一篇，排在天里，标题按展示字号放大。
 *
 * 它和 PostFeed 里的条目是同一份信息（标题 / 日期 / 时长 / 摘要 / 继续读 / 标签），
 * 只是字号和留白放大了一档 —— 首页需要一个「先读这个」的落点，
 * 而在一份编辑型刊物里那个落点就是最新一篇，不需要人工挑「精选」。
 *
 * 标题是 h2 不是 h1：这一页的 h1 是那行眉标（见 page.tsx 里的说明），
 * 它说的是「这一页是什么」，而不是「其中哪一篇」。
 */
export function FeaturedPost({ post, locale }: { post: PostMeta; locale: Locale }) {
  const copy = t(locale)
  const href = localePath(locale, post.slug)

  return (
    <article className="lede">
      <h2 className="u-hero lede__title">
        <Link href={href}>{post.title}</Link>
      </h2>

      <p className="u-meta lede__meta">
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
        <span>{formatReadingTime(post.readingMinutes, locale)}</span>
      </p>

      {post.summary && <p className="lede__summary">{post.summary}</p>}

      <div className="lede__foot">
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
  )
}
