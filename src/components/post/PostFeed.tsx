import Image from 'next/image'
import Link from 'next/link'
import type { Locale } from '@config'

import { localePath, type PostMeta } from '@/lib/content'
import { formatDate, formatReadingTime } from '@/lib/format'
import { t } from '@/lib/i18n'
import { RooMark } from '@/components/brand/Kangaroo'
import { ArrowRightIcon } from '@/components/layout/Icons'

/**
 * 首页 / 分页页的文章流。
 *
 * 头一篇铺一张宽封面、标题也放大一档，其余走「缩略图 + 文字」的横条。
 * 这个差别是版面的重心：一屏里只该有一个入口最响，十篇都铺大图等于十篇都不响。
 * 分页第 2 页起就没有头条了（lead=false）—— 「最新一篇」这个身份只属于第一页。
 */
export function PostFeed({
  posts,
  locale,
  /** 只有第一页把头一篇做成头条 */
  showLead = true,
}: {
  posts: PostMeta[]
  locale: Locale
  showLead?: boolean
}) {
  const copy = t(locale)

  if (posts.length === 0) {
    return <p className="page__empty">{copy.empty}</p>
  }

  return (
    <ol className="feed">
      {posts.map((post, index) => (
        <FeedItem key={post.slug} post={post} locale={locale} lead={showLead && index === 0} priority={index === 0} />
      ))}
    </ol>
  )
}

function FeedItem({
  post,
  locale,
  lead,
  priority,
}: {
  post: PostMeta
  locale: Locale
  lead: boolean
  priority: boolean
}) {
  const copy = t(locale)
  const href = localePath(locale, post.slug)

  return (
    <li className={`feed__item${lead ? ' feed__item--lead' : ''}`}>
      {/*
       * 封面是纯视觉的第二个入口：它和标题指向同一处，所以对读屏器隐藏，
       * 也不进 Tab 序列 —— 否则每篇文章会读出两个一模一样的链接。
       */}
      <Link href={href} className="feed__cover" tabIndex={-1} aria-hidden>
        <Cover post={post} sizes={lead ? '(max-width: 62rem) 100vw, 44rem' : '(max-width: 40rem) 100vw, 12rem'} priority={priority} />
      </Link>

      <div>
        <p className="u-meta feed__meta">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
          <span>{formatReadingTime(post.readingMinutes, locale)}</span>
        </p>

        <h2 className="u-h2 feed__title">
          <Link href={href}>{post.title}</Link>
        </h2>

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
      </div>
    </li>
  )
}

/**
 * 封面。缺图时不留白格 —— 列表靠图建立左侧的节奏，塌一个就会断。
 * 兜底是一块淡蓝渐变加一只小袋鼠，看起来像「这篇还没配图」而不是「这里坏了」。
 */
function Cover({ post, sizes, priority }: { post: PostMeta; sizes: string; priority: boolean }) {
  if (!post.coverUrl) {
    return (
      <div className="feed__fallback">
        <RooMark idPrefix={`cover-${post.slug}`} />
      </div>
    )
  }

  return <Image src={post.coverUrl} alt="" fill sizes={sizes} priority={priority} className="object-cover" />
}
