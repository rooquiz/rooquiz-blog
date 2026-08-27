import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { site } from '@config'

import { getAllPosts, isLocale, localePath } from '@/lib/content'
import { t } from '@/lib/i18n'
import { buildMetadata } from '@/lib/metadata'
import { SiteFrame } from '@/components/layout/SiteFrame'
import { Pager } from '@/components/post/Pager'
import { PostStage } from '@/components/post/PostStage'

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
  const copy = t(locale)

  return (
    <SiteFrame
      locale={locale}
      localeHrefs={HOME_PATHS}
      section="journal"
      /*
       * 视觉稿在这个位置没有大标题 —— 当前栏目是靠导航里那一项变洋红来指示的。
       * h1 因此做成商标下方那行小型大写：语义上仍是页面标题，视觉上是一枚栏目标签。
       */
      eyebrow={<h1 className="u-micro head__eyebrow">{copy.journal}</h1>}
    >
      <main>
        <PostStage posts={posts.slice(0, site.pageSize)} locale={locale} />
        <Pager locale={locale} current={1} total={totalPages} />
      </main>
    </SiteFrame>
  )
}
