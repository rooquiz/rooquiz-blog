import { site } from '@config'

import { getAllPosts, readPostSource } from '@/lib/content'
import { toMarkdownDocument } from '@/lib/content/markdown'
import { sitePath } from '@/lib/routes'
import { absoluteUrl } from '@/lib/seo'

/**
 * `/llms-full.txt` —— 全站正文拼成一份文档，配套 `/llms.txt`。
 *
 * 存在的理由是一次取全：模型要回答「这个站对某个题目怎么说」时，
 * 逐篇去抓要几十个请求，而且中途丢一篇就答偏。
 *
 * 上限 50 篇是有意的。文章上千之后这份文件会变成几兆的单体，
 * 取它的一方多半只用得到前面一小截，剩下的纯粹是带宽。
 * 全集始终在 `/llms.txt` 的清单里，按需逐篇取。
 */

export const dynamic = 'force-static'

const MAX_POSTS = 50

export async function GET() {
  const all = await getAllPosts()
  const posts = all.slice(0, MAX_POSTS)

  const documents = await Promise.all(posts.map(async post => toMarkdownDocument(post, await readPostSource(post))))

  /* 头部那行时间取「最新的一次改动」，不取构建时刻 ——
     构建时刻会让这份文件每次部署都变，产物不再可复现（同 lib/format.ts 固定时区的理由）。 */
  const lastModified = posts.reduce((latest, post) => (post.updatedAt > latest ? post.updatedAt : latest), '')

  const header = [
    `# ${site.title} — full text`,
    '',
    `> ${site.description}`,
    '',
    `- Site: ${absoluteUrl(sitePath())}`,
    `- Publisher: ${site.organization.name} (${site.organization.url})`,
    `- Articles in this file: ${posts.length}${all.length > posts.length ? ` of ${all.length} (most recent first)` : ''}`,
    ...(lastModified ? [`- Last updated: ${lastModified.slice(0, 10)}`] : []),
    `- Index: ${absoluteUrl('/llms.txt')}`,
    '',
  ].join('\n')

  return new Response([header, ...documents].join('\n---\n\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
