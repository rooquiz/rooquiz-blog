import Link from 'next/link'

import { type PostMeta } from '@/lib/content'
import { sitePath } from '@/lib/routes'
import { formatDate, formatReadingTime } from '@/lib/format'

/**
 * 紧凑的索引行。分类归档页与搜索结果页用。
 *
 * 那两个页面刻意不复用首页的 PostFeed：读者到那里是在「找一篇」而不是「随便看看」，
 * 一屏能扫过的条数比每条有多少信息重要 —— 所以没有封面、摘要压到两行。
 * 但仍留在同一套语言里：同样的圆角、同样的洋红 hover、同样的元信息小字。
 */
export function PostRow({ post }: { post: PostMeta }) {
  return (
    <li>
      <Link href={sitePath(post.slug)} className="row__link">
        <p className="u-meta feed__meta">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span>{formatReadingTime(post.readingMinutes)}</span>
        </p>
        <h2 className="row__title mt-1">{post.title}</h2>
        {post.summary && <p className="row__summary">{post.summary}</p>}
      </Link>
    </li>
  )
}
