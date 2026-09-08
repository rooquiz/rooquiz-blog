import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, site } from '@config'

import { getAllPosts, getAllTags, isLocale, localePath } from '@/lib/content'
import { t } from '@/lib/i18n'
import { buildMetadata } from '@/lib/metadata'
import { SiteFrame } from '@/components/layout/SiteFrame'
import { CategoryRail } from '@/components/post/CategoryRail'
import { Pager } from '@/components/post/Pager'
import { PostFeed } from '@/components/post/PostFeed'

export const dynamic = 'force-static'
export const dynamicParams = false

/** 第 1 页就是 /[locale] 本身，这里只产出第 2 页起 */
export async function generateStaticParams() {
  const params: { locale: string; n: string }[] = []
  for (const locale of LOCALES) {
    const total = Math.ceil((await getAllPosts(locale)).length / site.pageSize)
    for (let n = 2; n <= total; n++) params.push({ locale, n: String(n) })
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; n: string }>
}): Promise<Metadata> {
  const { locale, n } = await params
  if (!isLocale(locale)) return {}

  return buildMetadata({
    locale,
    title: t(locale).pageN(Number(n)),
    // 分页页只做 canonical 自指，不给 hreflang —— 各语言文章数不同，第 N 页内容对不上
    paths: { [locale]: localePath(locale, 'page', n) },
  })
}

export default async function PagedIndexPage({ params }: { params: Promise<{ locale: string; n: string }> }) {
  const { locale, n } = await params
  if (!isLocale(locale)) notFound()

  const current = Number(n)
  if (!Number.isInteger(current) || current < 2) notFound()

  const [posts, tags] = await Promise.all([getAllPosts(locale), getAllTags(locale)])
  const totalPages = Math.max(1, Math.ceil(posts.length / site.pageSize))
  if (current > totalPages) notFound()

  const slice = posts.slice((current - 1) * site.pageSize, current * site.pageSize)
  const copy = t(locale)

  return (
    <SiteFrame
      locale={locale}
      localeHrefs={{ en: localePath('en'), zh: localePath('zh') }}
      section="journal"
      hero={
        <>
          <p className="u-eyebrow">{copy.articlesEyebrow}</p>
          <h1 className="u-display">{copy.pageN(current)}</h1>
        </>
      }
    >
      <main className="shell home">
        <div className="home__main">
          {/* 第 2 页起没有头条：「最新一篇」这个身份只属于第一页 */}
          <PostFeed posts={slice} locale={locale} />
          <Pager locale={locale} current={current} total={totalPages} />
        </div>

        <CategoryRail tags={tags} locale={locale} />
      </main>
    </SiteFrame>
  )
}
