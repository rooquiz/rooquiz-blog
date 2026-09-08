import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { site } from '@config'

import { getAllPosts, getAllTags, isLocale, localePath } from '@/lib/content'
import { t } from '@/lib/i18n'
import { buildMetadata } from '@/lib/metadata'
import { RooMascot } from '@/components/brand/Roo'
import { SiteFrame } from '@/components/layout/SiteFrame'
import { CategoryRail } from '@/components/post/CategoryRail'
import { FeaturedPost } from '@/components/post/FeaturedPost'
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

  /*
   * 最新一篇当头条，剩下的排成文章流。两者一起构成第一页的 pageSize 篇 ——
   * 头条不是额外多出来的一篇，否则第二页会漏掉一篇。
   */
  const [featured, ...rest] = posts.slice(0, site.pageSize)

  return (
    /* 不传 hero —— 首页要的是拉满的那片天，英雄区由下面这个两栏网格自己排出来 */
    <SiteFrame locale={locale} localeHrefs={HOME_PATHS} section="journal">
      <main className="shell home">
        {/*
         * 袋鼠是网格里的一个格子（grid-area: roo），不塞在右栏组件里。
         * 这样窄屏塌成单栏时它能靠 grid-template-areas 排到最前面 ——
         * 留在右栏里的话，单栏下它会跟着分类和订阅一起掉到文章流后面，
         * 而它是第一屏的主角。
         */}
        <div className="home__perch" aria-hidden>
          <RooMascot className="home__roo" priority />
        </div>

        <div className="home__main">
          {/*
           * 页面的 h1 就是这行紫眉标。视觉上它只是一枚栏目标签，语义上它确实是
           * 「这一页是什么」—— 首页没有别的标题，头条那行大字说的是某一篇。
           */}
          <h1 className="u-eyebrow home__eyebrow">{copy.articlesEyebrow}</h1>

          {featured ? (
            <>
              <FeaturedPost post={featured} locale={locale} />
              {rest.length > 0 && <PostFeed posts={rest} locale={locale} className="home__rest" />}
              <Pager locale={locale} current={1} total={totalPages} />
            </>
          ) : (
            <p className="page__empty">{copy.empty}</p>
          )}
        </div>

        <CategoryRail tags={tags} locale={locale} />
      </main>
    </SiteFrame>
  )
}
