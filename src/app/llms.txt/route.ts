import { site } from '@config'

import { getAllPosts, getAllTags } from '@/lib/content'
import { postMarkdownPath, sitePath } from '@/lib/routes'
import { absoluteUrl } from '@/lib/seo'

/**
 * `/llms.txt` —— 给模型看的站点索引（llmstxt.org 那份约定）。
 *
 * 结构是规定死的：一个 H1、一段引述当摘要、若干 `##` 小节，每小节是一串
 * `[名字](链接): 一句话`。最后那个 `## Optional` 有特殊含义 ——
 * 上下文不够时可以整节跳过，所以只往里放锦上添花的东西。
 *
 * 链接一律指向 `.md` 版而不是 HTML 页：抓取端照着这份清单走，拿到的就是干净正文。
 *
 * 它不进 sitemap，也不需要 —— 这份文件是给直接来取的客户端准备的，不参与排名。
 */

export const dynamic = 'force-static'

/** 摘要里混进换行会把一条列表项劈成两条，清单格式当场散架 */
function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function isoDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

export async function GET() {
  const [posts, tags] = await Promise.all([getAllPosts(), getAllTags()])

  const lines = [
    `# ${site.title}`,
    '',
    `> ${site.description}`,
    '',
    `${site.title} is published by ${site.organization.name} (${site.organization.url}), the quiz builder for ` +
      'coaches and creators. Every article below is also served as plain Markdown: append `.md` to any article URL ' +
      'to get the text without the surrounding page.',
    '',
    '## Articles',
    '',
    ...posts.map(post => {
      const summary = oneLine(post.summary)
      const meta = `published ${isoDate(post.publishedAt)}, ${post.readingMinutes} min read`
      return `- [${post.title}](${absoluteUrl(postMarkdownPath(post.slug))}): ${summary ? `${summary} (${meta})` : meta}`
    }),
    '',
    '## Topics',
    '',
    ...tags.map(
      ({ tag, count }) =>
        `- [${tag}](${absoluteUrl(sitePath('tags', tag))}): ${count} ${count === 1 ? 'article' : 'articles'}`,
    ),
    '',
    '## Optional',
    '',
    `- [Full text of every article](${absoluteUrl('/llms-full.txt')}): one file, no fetching page by page.`,
    `- [RSS feed](${absoluteUrl(sitePath('feed.xml'))}): new articles as they are published.`,
    `- [Sitemap](${absoluteUrl('/sitemap.xml')}): every indexable URL on the site.`,
    `- [${site.organization.name}](${site.organization.url}): the product these articles are about.`,
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
