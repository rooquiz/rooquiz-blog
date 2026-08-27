import type { MetadataRoute } from 'next'
import { LOCALES, site } from '@config'

import { getAllPosts, getAllTags, localePath } from '@/lib/content'
import { absoluteUrl } from '@/lib/seo'

// 固化成静态 /sitemap.xml，不要每次请求现算
export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  for (const locale of LOCALES) {
    const posts = await getAllPosts(locale)

    entries.push({
      url: absoluteUrl(localePath(locale)),
      lastModified: posts[0] ? new Date(posts[0].publishedAt) : new Date(),
      changeFrequency: 'daily',
      priority: 1,
    })

    // 分页页（第 2 页起）
    const totalPages = Math.ceil(posts.length / site.pageSize)
    for (let n = 2; n <= totalPages; n++) {
      entries.push({
        url: absoluteUrl(localePath(locale, 'page', String(n))),
        changeFrequency: 'weekly',
        priority: 0.3,
      })
    }

    entries.push({
      url: absoluteUrl(localePath(locale, 'tags')),
      changeFrequency: 'weekly',
      priority: 0.5,
    })

    for (const { tag } of await getAllTags(locale)) {
      entries.push({
        url: absoluteUrl(localePath(locale, 'tags', tag)),
        changeFrequency: 'weekly',
        priority: 0.5,
      })
    }

    for (const post of posts) {
      entries.push({
        url: absoluteUrl(localePath(locale, post.slug)),
        lastModified: new Date(post.publishedAt),
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    }
  }

  // /search 是 noindex 的，不进 sitemap
  return entries
}
