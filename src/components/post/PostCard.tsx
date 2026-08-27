import Link from 'next/link'
import type { Locale } from '@config'

import { localePath, type PostMeta } from '@/lib/content'
import { formatReadingTime, formatStamp } from '@/lib/format'

/**
 * 索引行。标签页 / 搜索结果页用 —— 那些页面不该再来一遍首页那套满幅舞台
 * （一屏一条，翻十屏找不到东西），但要留在同一套版式语言里：
 * 发丝线分隔、日期走方形宽体、标题走展示体、其余小型大写。
 *
 * 刻意不用 HeroUI 的 Card：它是 'use client'，一屏十几行会把整份 react-aria
 * 拖进首屏，而这里不需要任何交互。
 */
export function PostCard({ post, locale }: { post: PostMeta; locale: Locale }) {
  return (
    <li className="row">
      <Link href={localePath(locale, post.slug)} className="row__link">
        <time className="u-micro row__stamp" dateTime={post.publishedAt}>
          {formatStamp(post.publishedAt, locale)}
        </time>

        <div className="row__main">
          <h2 className="u-title row__title">{post.title}</h2>
          {post.summary && <p className="row__summary">{post.summary}</p>}
        </div>

        <span className="u-micro row__aside">
          {post.tags[0] && <span className="row__tag">{post.tags[0]}</span>}
          <span>{formatReadingTime(post.readingMinutes, locale)}</span>
        </span>
      </Link>
    </li>
  )
}
