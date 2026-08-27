import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LOCALES, site, type Locale } from '@config'

import {
  getAllPostParams,
  getNeighbours,
  getPost,
  getTranslations,
  isLocale,
  localePath,
  readPostSource,
  type PostMeta,
} from '@/lib/content'
import { renderMdx } from '@/lib/content/mdx'
import { extractToc } from '@/lib/content/toc'
import { formatReadingTime, formatStamp } from '@/lib/format'
import { t } from '@/lib/i18n'
import { buildMetadata } from '@/lib/metadata'
import { absoluteUrl } from '@/lib/seo'
import { SiteFrame } from '@/components/layout/SiteFrame'
import { TableOfContents } from '@/components/post/TableOfContents'
import { ViewCounter } from '@/components/post/ViewCounter'

export const dynamic = 'force-static'
/** 只渲染 generateStaticParams 列出的文章；其余一律 404，不做运行时兜底 */
export const dynamicParams = false

export async function generateStaticParams() {
  return getAllPostParams()
}

/** 收集这篇文章在各语言下的路径，缺哪个语言就不输出那条 alternate */
async function localePathsFor(translationKey: string): Promise<Partial<Record<Locale, string>>> {
  const translations = await getTranslations(translationKey)
  const paths: Partial<Record<Locale, string>> = {}
  for (const locale of LOCALES) {
    const slug = translations[locale]
    if (slug) paths[locale] = localePath(locale, slug)
  }
  return paths
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}

  const post = await getPost(locale, slug)
  if (!post) return {}

  return {
    ...buildMetadata({
      locale,
      title: post.title,
      description: post.summary,
      paths: await localePathsFor(post.translationKey),
    }),
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.summary,
      url: absoluteUrl(localePath(locale, post.slug)),
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
    },
  }
}

export default async function PostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  const post = await getPost(locale, slug)
  if (!post) notFound()

  const source = await readPostSource(post)
  const [content, localeHrefs, neighbours] = await Promise.all([
    renderMdx(source),
    localePathsFor(post.translationKey),
    getNeighbours(locale, post.slug),
  ])
  const toc = extractToc(source)
  const copy = t(locale)

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', '@id': site.organization.id, name: post.author },
    publisher: { '@id': site.organization.id },
    mainEntityOfPage: absoluteUrl(localePath(locale, post.slug)),
    inLanguage: locale === 'zh' ? 'zh-Hans' : 'en',
    keywords: post.tags.join(', '),
  }

  return (
    <SiteFrame locale={locale} localeHrefs={localeHrefs} section="journal">
      {/*
       * 左影像带里那块固定的封面裁切 —— 和列表页同一个窗口位置（--band-t / --band-h），
       * 所以从列表点进文章，左边那条影像是连续的，站点是同一个站点。
       */}
      {post.coverUrl && (
        <div className="article__rail" aria-hidden>
          <Image src={post.coverUrl} alt="" fill sizes="20vw" priority className="object-cover" />
        </div>
      )}

      <main className="article">
        <script
          type="application/ld+json"
          // JSON-LD 的内容全部来自我们自己的索引，不含用户输入
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />

        <article className="article__body">
          <header>
            <p className="u-micro article__stamp">
              <time dateTime={post.publishedAt}>{formatStamp(post.publishedAt, locale)}</time>
            </p>

            <h1 className="article__title">{post.title}</h1>

            {post.summary && <p className="article__lede">{post.summary}</p>}
          </header>

          <div className="prose article__prose">{content}</div>
        </article>

        {/* 竖线右侧那段留白：原稿放预览卡，文章页放元信息与目录，并跟着滚动吸顶 */}
        <aside className="article__aside">
          <ul className="u-micro article__meta">
            <li>{post.author}</li>
            <li>{formatReadingTime(post.readingMinutes, locale)}</li>
            {/* 阅读量拿不到数就整条不渲染，见 ViewCounter 里的取舍说明 */}
            <li>
              <ViewCounter locale={locale} slug={post.slug} />
            </li>
          </ul>

          {post.tags.length > 0 && (
            <ul className="article__tags">
              {post.tags.map(tag => (
                <li key={tag}>
                  <Link href={localePath(locale, 'tags', tag)} className="u-micro article__tag">
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {toc.length >= 3 && (
            <div className="article__toc">
              <TableOfContents entries={toc} locale={locale} />
            </div>
          )}
        </aside>
      </main>

      <nav className="article__nav">
        <Neighbour post={neighbours.previous} locale={locale} label={copy.prevPost} direction="prev" />
        <Link href={localePath(locale)} className="u-micro u-cue article__back">
          {copy.backToList}
        </Link>
        <Neighbour post={neighbours.next} locale={locale} label={copy.nextPost} direction="next" />
      </nav>
    </SiteFrame>
  )
}

/** 上一篇 / 下一篇。没有邻居就渲染一个空占位，保证三栏的位置不塌 */
function Neighbour({
  post,
  locale,
  label,
  direction,
}: {
  post: PostMeta | null
  locale: Locale
  label: string
  direction: 'prev' | 'next'
}) {
  if (!post) return <span />

  return (
    <Link
      href={localePath(locale, post.slug)}
      rel={direction === 'prev' ? 'prev' : 'next'}
      className={`article__neighbour${direction === 'next' ? 'article__neighbour--next' : ''}`}
    >
      <span className="u-micro text-[var(--muted)]">
        {direction === 'prev' ? '←' : '→'} {label}
      </span>
      <span className="u-title article__neighbour-title">{post.title}</span>
    </Link>
  )
}
