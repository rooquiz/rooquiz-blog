import type { Metadata } from 'next'
import { site } from '@config'

import { getAllPosts, getAllTags } from '@/lib/content'
import { sitePath } from '@/lib/routes'
import { copy } from '@/lib/i18n'
import { blogIndexJsonLd } from '@/lib/jsonld'
import { buildMetadata } from '@/lib/metadata'
import { RooMascot } from '@/components/brand/Roo'
import { SiteFrame } from '@/components/layout/SiteFrame'
import { HomeMotion } from '@/components/motion/HomeMotion'
import { JsonLd } from '@/components/seo/JsonLd'
import { CategoryRail } from '@/components/post/CategoryRail'
import { FeaturedPost } from '@/components/post/FeaturedPost'
import { Pager } from '@/components/post/Pager'
import { PostFeed } from '@/components/post/PostFeed'

export const dynamic = 'force-static'

export function generateMetadata(): Metadata {
  /*
   * 首页的 <title> 走 site.homeTitle 而不是默认的站名（理由写在 site.config.ts）。
   *
   * 品牌名在这里要**手工接上**：根 layout 那条 `%s · RooQuiz Blog` 模板只作用于
   * 下层路由段，而 app/page.tsx 和 app/layout.tsx 是同一段 —— 只写 homeTitle
   * 出来的标题里一个品牌名都没有。改这一句时对照 layout.tsx 里的模板，别让两边的分隔符漂开。
   */
  return buildMetadata({ title: `${site.homeTitle} · ${site.title}`, path: sitePath() })
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

      {/*
       * 结构化数据。人看到的是下面那一列卡片，机器看到的是同一份内容的 ItemList ——
       * 生成式检索靠它一次拿全「这个站有哪些文章」，不用逐页去爬。
       */}
      <JsonLd data={blogIndexJsonLd(posts.slice(0, site.pageSize), { path: sitePath(), page: 1 })} />

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
