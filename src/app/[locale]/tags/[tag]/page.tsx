import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, type Locale } from '@config'

import { getAllTags, getPostsByTag, isLocale, localePath } from '@/lib/content'
import { t } from '@/lib/i18n'
import { buildMetadata } from '@/lib/metadata'
import { SiteFrame } from '@/components/layout/SiteFrame'
import { PostCard } from '@/components/post/PostCard'

export const dynamic = 'force-static'
export const dynamicParams = false

export async function generateStaticParams() {
  const params: { locale: string; tag: string }[] = []
  for (const locale of LOCALES) {
    for (const { tag } of await getAllTags(locale)) params.push({ locale, tag })
  }
  return params
}

/** 标签是跨语言共用的字符串，但某个标签未必在两种语言下都有文章 */
async function tagPathsFor(tag: string): Promise<Partial<Record<Locale, string>>> {
  const paths: Partial<Record<Locale, string>> = {}
  for (const locale of LOCALES) {
    const posts = await getPostsByTag(locale, tag)
    if (posts.length > 0) paths[locale] = localePath(locale, 'tags', tag)
  }
  return paths
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>
}): Promise<Metadata> {
  const { locale, tag } = await params
  if (!isLocale(locale)) return {}

  const decoded = decodeURIComponent(tag)
  return buildMetadata({
    locale,
    title: t(locale).postsUnderTag(decoded),
    paths: await tagPathsFor(decoded),
  })
}

export default async function TagArchivePage({ params }: { params: Promise<{ locale: string; tag: string }> }) {
  const { locale, tag } = await params
  if (!isLocale(locale)) notFound()

  const decoded = decodeURIComponent(tag)
  const posts = await getPostsByTag(locale, decoded)
  const copy = t(locale)

  return (
    <SiteFrame locale={locale} localeHrefs={await tagPathsFor(decoded)} section="tags">
      <main className="page">
        <p className="u-micro text-[var(--accent)]">{copy.tags}</p>
        <h1 className="page__title mt-4">{decoded}</h1>

        {posts.length === 0 ? (
          <p className="page__empty">{copy.emptyTag}</p>
        ) : (
          <ul className="page__list">
            {posts.map(post => (
              <PostCard key={post.slug} post={post} locale={locale} />
            ))}
          </ul>
        )}
      </main>
    </SiteFrame>
  )
}
