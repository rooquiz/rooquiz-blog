import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getAllTags, isLocale, localePath } from '@/lib/content'
import { t } from '@/lib/i18n'
import { buildMetadata } from '@/lib/metadata'
import { SiteFrame } from '@/components/layout/SiteFrame'

export const dynamic = 'force-static'

const TAGS_PATHS = { en: localePath('en', 'tags'), zh: localePath('zh', 'tags') }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return buildMetadata({ locale, title: t(locale).categories, paths: TAGS_PATHS })
}

export default async function TagsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const tags = await getAllTags(locale)
  const copy = t(locale)

  return (
    <SiteFrame
      locale={locale}
      localeHrefs={TAGS_PATHS}
      section="tags"
      hero={
        <>
          <p className="u-eyebrow u-eyebrow--sky">{copy.browseByCategory}</p>
          <h1 className="u-display">{copy.categories}</h1>
        </>
      }
    >
      <main className="shell page">
        {tags.length === 0 ? (
          <p className="page__empty">{copy.empty}</p>
        ) : (
          <ul className="tagcloud">
            {tags.map(({ tag, count }) => (
              <li key={tag}>
                <Link href={localePath(locale, 'tags', tag)} className="chip">
                  {tag}
                  <span className="chip__count">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </SiteFrame>
  )
}
