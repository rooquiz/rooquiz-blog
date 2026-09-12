import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { site } from '@config'

import { getAllPosts, getAllTags } from '@/lib/content'
import { sitePath } from '@/lib/routes'
import { copy } from '@/lib/i18n'
import { blogIndexJsonLd } from '@/lib/jsonld'
import { buildMetadata } from '@/lib/metadata'
import { SiteFrame } from '@/components/layout/SiteFrame'
import { JsonLd } from '@/components/seo/JsonLd'
import { CategoryRail } from '@/components/post/CategoryRail'
import { Pager } from '@/components/post/Pager'
import { PostFeed } from '@/components/post/PostFeed'

export const dynamic = 'force-static'
export const dynamicParams = false

/** 第 1 页就是 `/` 本身，这里只产出第 2 页起 */
export async function generateStaticParams() {
  const total = Math.ceil((await getAllPosts()).length / site.pageSize)
  const params: { n: string }[] = []
  for (let n = 2; n <= total; n++) params.push({ n: String(n) })
  return params
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params
  return buildMetadata({
    title: copy.pageN(Number(n)),
    description: copy.pageMetaDescription(Number(n)),
    path: sitePath('page', n),
  })
}

export default async function PagedIndexPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params

  const current = Number(n)
  if (!Number.isInteger(current) || current < 2) notFound()

  const [posts, tags] = await Promise.all([getAllPosts(), getAllTags()])
  const totalPages = Math.max(1, Math.ceil(posts.length / site.pageSize))
  if (current > totalPages) notFound()

  const slice = posts.slice((current - 1) * site.pageSize, current * site.pageSize)

  return (
    <SiteFrame
      section="journal"
      hero={
        <>
          <p className="u-eyebrow">{copy.articlesEyebrow}</p>
          <h1 className="u-display">{copy.pageN(current)}</h1>
        </>
      }
    >
      <main className="shell home">
        <JsonLd
          data={blogIndexJsonLd(slice, {
            path: sitePath('page', n),
            page: current,
            description: copy.pageMetaDescription(current),
          })}
        />

        <div className="home__main">
          {/* 第 2 页起没有头条：「最新一篇」这个身份只属于第一页 */}
          <PostFeed posts={slice} />
          <Pager current={current} total={totalPages} />
        </div>

        <CategoryRail tags={tags} />
      </main>
    </SiteFrame>
  )
}
