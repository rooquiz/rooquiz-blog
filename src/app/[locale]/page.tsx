import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { site } from '@config'

import { getAllPosts, getAllTags, isLocale, localePath } from '@/lib/content'
import { t } from '@/lib/i18n'
import { buildMetadata } from '@/lib/metadata'
import { SiteFrame } from '@/components/layout/SiteFrame'
import { CategoryRail } from '@/components/post/CategoryRail'
import { Pager } from '@/components/post/Pager'
import { PostFeed } from '@/components/post/PostFeed'

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

  const [posts, tags] = await Promise.all([getAllPosts(locale), getAllTags(locale)])
  const totalPages = Math.max(1, Math.ceil(posts.length / site.pageSize))
  const copy = t(locale)

  return (
    /* 不传 hero —— 首页要的是拉满的那片天（彩虹拱 + 袋鼠），见 SiteFrame */
    <SiteFrame locale={locale} localeHrefs={HOME_PATHS} section="journal">
      <main className="shell home">
        <div className="home__main">
          {/*
           * 页面的 h1 就是这行洋红眉标。视觉上它只是一枚栏目标签，语义上它确实是
           * 「这一页是什么」—— 首页没有别的标题，天上那块是插画不是文字。
           */}
          <h1 className="u-eyebrow home__eyebrow">{copy.articlesEyebrow}</h1>

          <PostFeed posts={posts.slice(0, site.pageSize)} locale={locale} />
          <Pager locale={locale} current={1} total={totalPages} />
        </div>

        <CategoryRail tags={tags} locale={locale} />
      </main>
    </SiteFrame>
  )
}
