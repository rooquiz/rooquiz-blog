import type { Metadata } from 'next'
import { site } from '@config'

import { getAllPosts, getAllTags } from '@/lib/content'
import { sitePath } from '@/lib/routes'
import { copy } from '@/lib/i18n'
import { buildMetadata } from '@/lib/metadata'
import { RooMascot } from '@/components/brand/Roo'
import { SiteFrame } from '@/components/layout/SiteFrame'
import { HomeMotion } from '@/components/motion/HomeMotion'
import { CategoryRail } from '@/components/post/CategoryRail'
import { FeaturedPost } from '@/components/post/FeaturedPost'
import { Pager } from '@/components/post/Pager'
import { PostFeed } from '@/components/post/PostFeed'

export const dynamic = 'force-static'

export function generateMetadata(): Metadata {
  return buildMetadata({ path: sitePath() })
}

export default async function BlogIndexPage() {
  const [posts, tags] = await Promise.all([getAllPosts(), getAllTags()])
  const totalPages = Math.max(1, Math.ceil(posts.length / site.pageSize))

  /*
   * 最新一篇当头条，剩下的排成文章流。两者一起构成第一页的 pageSize 篇 ——
   * 头条不是额外多出来的一篇，否则第二页会漏掉一篇。
   */
  const [featured, ...rest] = posts.slice(0, site.pageSize)

  return (
    /* 不传 hero —— 首页要的是拉满的那片天，英雄区由下面这个两栏网格自己排出来 */
    <SiteFrame section="journal">
      {/*
       * 入场编排。零 DOM 的客户端组件 —— 它要动的东西跨 .sky（在 SiteFrame 里）
       * 和下面这个网格两棵子树，没有共同的客户端边界，所以自己去查 .frame--home。
       * 只有首页挂它，那份 GSAP 也就只进首页的 chunk。
       */}
      <HomeMotion />

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
              <FeaturedPost post={featured} />
              {rest.length > 0 && <PostFeed posts={rest} className="home__rest" />}
              <Pager current={1} total={totalPages} />
            </>
          ) : (
            <p className="page__empty">{copy.empty}</p>
          )}
        </div>

        <CategoryRail tags={tags} />
      </main>
    </SiteFrame>
  )
}
