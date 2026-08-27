import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getAllTags, isLocale, localePath } from '@/lib/content'
import { t } from '@/lib/i18n'
import { buildMetadata } from '@/lib/metadata'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'

export const dynamic = 'force-static'

const TAGS_PATHS = { en: localePath('en', 'tags'), zh: localePath('zh', 'tags') }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return buildMetadata({ locale, title: t(locale).tags, paths: TAGS_PATHS })
}

export default async function TagsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const tags = await getAllTags(locale)

  return (
    <>
      <SiteHeader locale={locale} localeHrefs={TAGS_PATHS} />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">{t(locale).tags}</h1>

        <ul className="mt-8 flex flex-wrap gap-3">
          {tags.map(({ tag, count }) => (
            <li key={tag}>
              <Link
                href={localePath(locale, 'tags', tag)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {tag}
                <span className="text-xs text-[var(--muted)]">{count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <SiteFooter locale={locale} />
    </>
  )
}
