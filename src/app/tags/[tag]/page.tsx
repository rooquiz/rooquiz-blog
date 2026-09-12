import type { Metadata } from 'next'

import { getAllTags, getPostsByTag } from '@/lib/content'
import { sitePath } from '@/lib/routes'
import { copy } from '@/lib/i18n'
import { tagArchiveJsonLd } from '@/lib/jsonld'
import { buildMetadata } from '@/lib/metadata'
import { SiteFrame } from '@/components/layout/SiteFrame'
import { JsonLd } from '@/components/seo/JsonLd'
import { PostRow } from '@/components/post/PostRow'

export const dynamic = 'force-static'
export const dynamicParams = false

export async function generateStaticParams() {
  return (await getAllTags()).map(({ tag }) => ({ tag }))
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const posts = await getPostsByTag(decoded)

  return buildMetadata({
    title: copy.postsUnderTag(decoded),
    // 不给描述的话每个分类页在 SERP 里都是同一段站点描述（见 lib/i18n.ts）
    description: copy.tagMetaDescription(decoded, posts.length),
    path: sitePath('tags', decoded),
  })
}

export default async function TagArchivePage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const posts = await getPostsByTag(decoded)

  return (
    <SiteFrame
      section="tags"
      hero={
        <>
          <p className="u-eyebrow">{copy.categories}</p>
          <h1 className="u-display">{decoded}</h1>
          <p className="u-meta sky__meta">{copy.resultCount(posts.length)}</p>
        </>
      }
    >
      <main className="shell shell--narrow page">
        <JsonLd data={tagArchiveJsonLd(decoded, posts, copy.tagMetaDescription(decoded, posts.length))} />

        {posts.length === 0 ? (
          <p className="page__empty">{copy.emptyTag}</p>
        ) : (
          <ul className="rows">
            {posts.map(post => (
              <PostRow key={post.slug} post={post} />
            ))}
          </ul>
        )}
      </main>
    </SiteFrame>
  )
}
