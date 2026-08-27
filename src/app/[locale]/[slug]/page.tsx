import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LOCALES, site, type Locale } from '@config'

import { getAllPostParams, getPost, getTranslations, isLocale, localePath, readPostSource } from '@/lib/content'
import { renderMdx } from '@/lib/content/mdx'
import { extractToc } from '@/lib/content/toc'
import { formatDate, formatReadingTime } from '@/lib/format'
import { t } from '@/lib/i18n'
import { buildMetadata } from '@/lib/metadata'
import { absoluteUrl } from '@/lib/seo'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
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
  const [content, localeHrefs] = await Promise.all([renderMdx(source), localePathsFor(post.translationKey)])
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
    <>
      <SiteHeader locale={locale} localeHrefs={localeHrefs} />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <script
          type="application/ld+json"
          // JSON-LD 的内容全部来自我们自己的索引，不含用户输入
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />

        <article>
          <header className="border-b border-[var(--border)] pb-8">
            <h1 className="text-3xl leading-tight font-semibold tracking-tight">{post.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--muted)]">
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
              <span aria-hidden>·</span>
              <span>{formatReadingTime(post.readingMinutes, locale)}</span>
              <span aria-hidden>·</span>
              <ViewCounter locale={locale} slug={post.slug} />
            </div>

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
          </header>

          {toc.length >= 3 && (
            <div className="mt-8">
              <TableOfContents entries={toc} locale={locale} />
            </div>
          )}

          <div className="prose mt-10">{content}</div>
        </article>

        <p className="mt-16">
          <Link href={localePath(locale)} className="text-sm text-[var(--accent)] hover:underline">
            ← {copy.backToList}
          </Link>
        </p>
      </main>

      <SiteFooter locale={locale} />
    </>
  )
}
