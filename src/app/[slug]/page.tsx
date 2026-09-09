import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { clsx } from 'clsx'
import { site } from '@config'

import { getAllPostParams, getNeighbours, getPost, readPostSource, type PostMeta } from '@/lib/content'
import { sitePath } from '@/lib/routes'
import { renderMdx } from '@/lib/content/mdx'
import { extractToc } from '@/lib/content/toc'
import { formatDate, formatReadingTime } from '@/lib/format'
import { copy } from '@/lib/i18n'
import { buildMetadata } from '@/lib/metadata'
import { absoluteUrl } from '@/lib/seo'
import { SiteFrame } from '@/components/layout/SiteFrame'
import { ArrowLeftIcon } from '@/components/layout/Icons'
import { TableOfContents } from '@/components/post/TableOfContents'
import { ViewCounter } from '@/components/post/ViewCounter'

export const dynamic = 'force-static'
/** 只渲染 generateStaticParams 列出的文章；其余一律 404，不做运行时兜底 */
export const dynamicParams = false

export async function generateStaticParams() {
  return getAllPostParams()
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  const post = await getPost(slug)
  if (!post) return {}

  return {
    ...buildMetadata({
      title: post.title,
      description: post.summary,
      path: sitePath(post.slug),
    }),
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.summary,
      url: absoluteUrl(sitePath(post.slug)),
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
    },
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const post = await getPost(slug)
  if (!post) notFound()

  const source = await readPostSource(post)
  const [content, neighbours] = await Promise.all([renderMdx(source), getNeighbours(post.slug)])
  const toc = extractToc(source)

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', '@id': site.organization.id, name: post.author },
    publisher: { '@id': site.organization.id },
    mainEntityOfPage: absoluteUrl(sitePath(post.slug)),
    inLanguage: 'en',
    keywords: post.tags.join(', '),
  }

  return (
    <SiteFrame
      section="journal"
      hero={
        <>
          {/*
           * 眉标用首个标签而不是固定的「文章」：读者从列表点进来已经知道这是文章，
           * 更有用的信息是「这篇属于哪一类」。没有标签才退回栏目名。
           */}
          <p className="u-eyebrow">{post.tags[0] ?? copy.journal}</p>

          <h1 className="u-display">{post.title}</h1>

          <p className="u-meta sky__meta">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <span>{formatReadingTime(post.readingMinutes)}</span>
            {/* 阅读量拿不到数就整条不渲染，见 ViewCounter 里的取舍说明 */}
            <ViewCounter slug={post.slug} />
          </p>
        </>
      }
    >
      <main className="shell article">
        <script
          type="application/ld+json"
          // JSON-LD 的内容全部来自我们自己的索引，不含用户输入
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />

        <article className="article__body">
          {post.coverUrl && (
            <div className="article__cover">
              <Image src={post.coverUrl} alt="" fill sizes="(max-width: 44rem) 100vw, 42rem" priority />
            </div>
          )}

          {post.summary && <p className="u-lede text-[1.0625em]">{post.summary}</p>}

          <div className="prose mt-8">{content}</div>

          {post.tags.length > 0 && (
            <div className="article__tags">
              <span className="u-eyebrow self-center">{copy.filedUnder}</span>
              {post.tags.map(tag => (
                <Link key={tag} href={sitePath('tags', tag)} className="chip">
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <nav className="article__nav" aria-label={copy.journal}>
            <Neighbour post={neighbours.previous} label={copy.prevPost} direction="prev" />
            <Neighbour post={neighbours.next} label={copy.nextPost} direction="next" />
          </nav>

          <p className="article__back">
            <Link href={sitePath()} className="pager__link">
              <ArrowLeftIcon />
              {copy.backToList}
            </Link>
          </p>
        </article>

        <aside className="article__aside">
          <TableOfContents entries={toc} />
        </aside>
      </main>
    </SiteFrame>
  )
}

/**
 * 上一篇 / 下一篇。没有邻居时渲染一个不可见的占位而不是干脆不渲染 ——
 * 两栏网格里少一格，剩下那格会滑到左边，「下一篇」就跑到了左侧，读起来像上一篇。
 */
function Neighbour({ post, label, direction }: { post: PostMeta | null; label: string; direction: 'prev' | 'next' }) {
  if (!post) return <span className="article__neighbour article__neighbour--empty" aria-hidden />

  return (
    <Link
      href={sitePath(post.slug)}
      rel={direction === 'prev' ? 'prev' : 'next'}
      /* 同 SiteFrame：类名走 clsx，模板字符串里的前导空格会被 prettier 的 tailwind 插件吃掉 */
      className={clsx('card article__neighbour', direction === 'next' && 'article__neighbour--next')}
    >
      <span className="u-eyebrow">
        {direction === 'prev' ? '← ' : ''}
        {label}
        {direction === 'next' ? ' →' : ''}
      </span>
      <span className="article__neighbour-title">{post.title}</span>
    </Link>
  )
}
