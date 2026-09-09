import { site } from '@config'

import { getAllPosts } from '@/lib/content'
import { sitePath } from '@/lib/routes'
import { absoluteUrl } from '@/lib/seo'

// 构建期固化成静态文件，运行时不查任何东西
export const dynamic = 'force-static'

/** XML 文本转义。标题/摘要来自我们自己的索引，但作者可能写了 & 或 < */
function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function GET() {
  const posts = (await getAllPosts()).slice(0, 50)
  const feedUrl = absoluteUrl(sitePath('feed.xml'))

  const items = posts
    .map(post => {
      const url = absoluteUrl(sitePath(post.slug))
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.summary)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
${post.tags.map(tag => `      <category>${escapeXml(tag)}</category>`).join('\n')}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${absoluteUrl(sitePath())}</link>
    <description>${escapeXml(site.description)}</description>
    <language>en</language>
    <lastBuildDate>${new Date(posts[0]?.publishedAt ?? Date.now()).toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
  })
}
