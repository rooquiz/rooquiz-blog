import Image from 'next/image'
import Link from 'next/link'
import type { Locale } from '@config'

import { localePath, type PostMeta } from '@/lib/content'
import { formatReadingTime, formatStamp } from '@/lib/format'
import { t } from '@/lib/i18n'

/**
 * 文章列表的「舞台」。视觉稿 docs/5bb4eb118bb50.mp4 的主体版式：
 * 每篇文章一格满幅条目 —— 左影像带里一张填满格子的裁切图，中央一张跨过竖线的
 * 预览卡（钉在视口中心），右侧偏左一栏日期 + 标题 + 摘要 + 下划线小字。
 *
 * 视差、卡片切换、右侧步进控件全部由 CSS 滚动驱动动画完成，这里不带任何 JS ——
 * 布局与动画的推导写在 src/styles/stage.css。
 *
 * 同一张图在一条里出现两次（影像带的高瘦裁切 + 中央的卡片）是原稿的招牌动作，
 * 不是冗余：next/image 会按 sizes 各取一档，不会下载两份同尺寸的图。
 */
export function PostStage({
  posts,
  locale,
  /** 当前这页第一篇在全站列表里的序号，供无封面时的排版砖显示 */
  offset = 0,
}: {
  posts: PostMeta[]
  locale: Locale
  offset?: number
}) {
  const copy = t(locale)

  if (posts.length === 0) {
    return <p className="u-micro page">{copy.empty}</p>
  }

  return (
    <ol className="stage">
      {posts.map((post, index) => {
        const href = localePath(locale, post.slug)
        const entryId = `post-${index + 1}`
        const number = String(offset + index + 1).padStart(2, '0')

        return (
          <li key={post.slug} className="entry" id={entryId}>
            <figure className="entry__rail" aria-hidden>
              <Cover post={post} number={number} sizes="20vw" variant="rail" />
            </figure>

            {/*
             * 卡片是文字条目里那个链接的视觉替身：鼠标可点，但对读屏器隐藏 ——
             * 否则每篇文章会读出两个一模一样的链接。tabindex=-1 保证它也不在 Tab 序列里。
             */}
            <Link href={href} className="entry__card" tabIndex={-1} aria-hidden>
              <Cover
                post={post}
                number={number}
                sizes="(max-width: 60rem) 100vw, 31vw"
                priority={index === 0}
                variant="card"
              />
            </Link>

            <div className="entry__text">
              <time className="u-stamp entry__stamp" dateTime={post.publishedAt}>
                {formatStamp(post.publishedAt, locale)}
              </time>

              <h2 className="u-title entry__title">
                <Link href={href}>{post.title}</Link>
              </h2>

              {post.summary && <p className="entry__summary">{post.summary}</p>}

              <p className="u-micro entry__meta">
                <span>{formatReadingTime(post.readingMinutes, locale)}</span>
                {post.tags[0] && (
                  <>
                    <span aria-hidden>/</span>
                    <Link href={localePath(locale, 'tags', post.tags[0])} className="hover:text-[var(--accent)]">
                      {post.tags[0]}
                    </Link>
                  </>
                )}
              </p>

              <p className="entry__cue">
                <Link href={href} className="u-micro u-cue" tabIndex={-1} aria-hidden>
                  {copy.cue}
                </Link>
              </p>
            </div>

            <Stepper
              previous={index > 0 ? `#post-${index}` : null}
              next={index < posts.length - 1 ? `#post-${index + 2}` : null}
            />
          </li>
        )
      })}
    </ol>
  )
}

/**
 * 封面。没有封面时换一块排版砖 —— 原稿里图就是设计本身，缺图留白等于版式塌掉，
 * 所以兜底也得是有意为之的一块：巨大的序号 + 首个标签。
 *
 * 只有中央那张卡承载文字。影像带里那块只留底色：卡片压在影像带之上，
 * 两块都排字的话，影像带那份会被卡片切掉右半边，露出来的半个字像渲染坏了。
 */
function Cover({
  post,
  number,
  sizes,
  priority,
  variant,
}: {
  post: PostMeta
  number: string
  sizes: string
  priority?: boolean
  variant: 'rail' | 'card'
}) {
  if (!post.coverUrl) {
    return (
      <div className="entry__tile" style={{ containerType: 'inline-size' }}>
        {variant === 'card' && (
          <>
            <span className="entry__tile-num">{number}</span>
            {post.tags[0] && <span className="u-micro entry__tile-tag">{post.tags[0]}</span>}
          </>
        )}
      </div>
    )
  }

  return <Image src={post.coverUrl} alt="" fill sizes={sizes} priority={priority} className="object-cover" />
}

/**
 * 右侧圆形步进控件。纯锚点 —— 靠 CSS 的 scroll-margin 把目标条目落到视口中心，
 * 不需要 JS。整组对读屏器隐藏：它只是滚动的视觉替身，键盘用户用方向键就够了，
 * 每条目一组会让辅助技术里多出 2N 个「上一篇/下一篇」。
 */
function Stepper({ previous, next }: { previous: string | null; next: string | null }) {
  return (
    <nav className="entry__step" aria-hidden>
      {previous ? (
        <a href={previous} tabIndex={-1}>
          <Triangle direction="up" />
        </a>
      ) : (
        <span>
          <Triangle direction="up" />
        </span>
      )}
      {next ? (
        <a href={next} tabIndex={-1}>
          <Triangle direction="down" />
        </a>
      ) : (
        <span>
          <Triangle direction="down" />
        </span>
      )}
    </nav>
  )
}

function Triangle({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg viewBox="0 0 10 8" aria-hidden>
      <path d={direction === 'up' ? 'M5 0 10 8H0z' : 'M5 8 0 0h10z'} />
    </svg>
  )
}
