import { site } from '@config'

import { sitePath } from '../routes'
import { absoluteUrl } from '../seo'
import type { PostMeta } from './types'

/**
 * 一篇文章的「可引用 Markdown」。
 *
 * `/{slug}.md` 与 `/llms-full.txt` 共用这一份投影，两处不要各拼各的 ——
 * 它们的读者是同一批（抓取端与模型），格式漂移会让同一篇文章在两个出口里
 * 长得不一样，引用时对不上。
 */

/** 去掉 frontmatter。与 toc.ts 里那条同源，改一处要看另一处 */
export function stripFrontmatter(source: string): string {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim()
}

/**
 * 正文词数，供 JSON-LD 的 `wordCount`。
 * 先把代码块整段丢掉（代码不是读者读的字），再把标记符号抹平，最后按空白切。
 */
export function countWords(source: string): number {
  const text = stripFrontmatter(source)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_~|-]/g, ' ')

  return text.split(/\s+/).filter(Boolean).length
}

/** ISO 时间戳 → YYYY-MM-DD。机器读的出口一律用这个，不用站内那种 "August 24, 2026" */
function isoDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

/**
 * 文章 → 一份自带出处的 Markdown 文档。
 *
 * 头部那几行元信息不是装饰：模型引用一段话时，能不能给出正确的链接、日期和作者，
 * 取决于这段话周围有没有这些事实。正文本身不动 —— 原样保留 Markdown 结构
 * （标题层级、列表、表格），那正是抓取端最好解析的形态。
 */
export function toMarkdownDocument(post: PostMeta, source: string): string {
  const url = absoluteUrl(sitePath(post.slug))
  const lines = [
    `# ${post.title}`,
    '',
    ...(post.summary ? [`> ${post.summary}`, ''] : []),
    `- Source: ${url}`,
    `- Published: ${isoDate(post.publishedAt)}`,
    ...(isoDate(post.updatedAt) !== isoDate(post.publishedAt) ? [`- Updated: ${isoDate(post.updatedAt)}`] : []),
    `- Author: ${post.author}`,
    `- Publisher: ${site.organization.name} (${site.organization.url})`,
    ...(post.tags.length > 0 ? [`- Topics: ${post.tags.join(', ')}`] : []),
    `- Reading time: ${post.readingMinutes} min`,
    '',
    '---',
    '',
    stripFrontmatter(source),
    '',
  ]

  return lines.join('\n')
}
