import type { MetadataRoute } from 'next'
import { site } from '@config'

import { getAllPosts, getAllTags, getPostsByTag, type PostMeta } from '@/lib/content'
import { sitePath } from '@/lib/routes'
import { absoluteUrl } from '@/lib/seo'

// 固化成静态 /sitemap.xml，不要每次请求现算
export const dynamic = 'force-static'

/** 一组文章里最后一次改动的时间。列表页的 lastmod 取它，而不是取发布时间 */
function lastTouched(posts: PostMeta[]): Date | undefined {
  const latest = posts.reduce((acc, post) => (post.updatedAt > acc ? post.updatedAt : acc), '')
  return latest ? new Date(latest) : undefined
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts()
  const entries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl(sitePath()),
      lastModified: lastTouched(posts) ?? new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]

  // 分页页（第 2 页起）
  const totalPages = Math.ceil(posts.length / site.pageSize)
  for (let n = 2; n <= totalPages; n++) {
    entries.push({
      url: absoluteUrl(sitePath('page', String(n))),
      lastModified: lastTouched(posts.slice((n - 1) * site.pageSize, n * site.pageSize)),
      changeFrequency: 'weekly',
      priority: 0.3,
    })
  }

  entries.push({
    url: absoluteUrl(sitePath('tags')),
    lastModified: lastTouched(posts),
    changeFrequency: 'weekly',
    priority: 0.5,
  })

  for (const { tag } of await getAllTags()) {
    entries.push({
      url: absoluteUrl(sitePath('tags', tag)),
      lastModified: lastTouched(await getPostsByTag(tag)),
      changeFrequency: 'weekly',
      priority: 0.5,
    })
  }

  for (const post of posts) {
    entries.push({
      url: absoluteUrl(sitePath(post.slug)),
      /*
       * lastmod 用「最后改动」而不是「发布时间」：抓取端靠这个值决定要不要回来重抓，
       * 写成发布时间的话，一篇改过的旧文在它眼里永远没变过。
       */
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'monthly',
      priority: 0.8,
      // 封面进图片 sitemap（Next 会展开成 image:image 命名空间），给图片搜索一个入口
      ...(post.coverUrl ? { images: [post.coverUrl] } : {}),
    })
  }

  // /search 是 noindex 的，不进 sitemap；/llms.txt 与 /{slug}.md 是给模型取的出口，
  // 不是要排名的页面，同样不进
  return entries
}
