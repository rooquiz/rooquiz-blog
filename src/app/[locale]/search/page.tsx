import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { isLocale, localePath } from '@/lib/content'
import { t } from '@/lib/i18n'
import { buildMetadata } from '@/lib/metadata'
import { SiteFrame } from '@/components/layout/SiteFrame'
import { SearchClient } from '@/components/post/SearchClient'

export const dynamic = 'force-static'

const SEARCH_PATHS = { en: localePath('en', 'search'), zh: localePath('zh', 'search') }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  // 搜索页本身没有内容价值，不进索引
  return buildMetadata({ locale, title: t(locale).search, paths: SEARCH_PATHS, noIndex: true })
}

export default async function SearchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const copy = t(locale)

  return (
    <SiteFrame
      locale={locale}
      localeHrefs={SEARCH_PATHS}
      section="search"
      hero={
        <>
          <p className="u-eyebrow">{copy.journal}</p>
          <h1 className="u-display">{copy.search}</h1>
        </>
      }
    >
      <main className="shell shell--narrow page">
        <SearchClient locale={locale} />
      </main>
    </SiteFrame>
  )
}
