import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { site } from '@config'

import { getAllPosts, isLocale, localePath } from '@/lib/content'
import { buildMetadata } from '@/lib/metadata'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { Pager } from '@/components/post/Pager'
import { PostCard } from '@/components/post/PostCard'

export const dynamic = 'force-static'

/** 首页在两种语言下都存在，hreflang 直接互指 */
const HOME_PATHS = { en: localePath('en'), zh: localePath('zh') }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return buildMetadata({ locale, paths: HOME_PATHS })
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const posts = await getAllPosts(locale)
  const totalPages = Math.max(1, Math.ceil(posts.length / site.pageSize))
  const copy = site.locales[locale]

  return (
    <>
      <SiteHeader locale={locale} localeHrefs={HOME_PATHS} />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-[var(--muted)]">{copy.tagline}</p>

        <div className="mt-8">
          {posts.slice(0, site.pageSize).map(post => (
            <PostCard key={post.slug} post={post} locale={locale} />
          ))}
        </div>

        <Pager locale={locale} current={1} total={totalPages} />
      </main>

      <SiteFooter locale={locale} />
    </>
  )
}
