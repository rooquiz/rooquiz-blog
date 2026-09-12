import { getAllPostParams, getPost, readPostSource } from '@/lib/content'
import { toMarkdownDocument } from '@/lib/content/markdown'

/**
 * 一篇文章的 Markdown 版。**对外的 URL 是 `/{slug}.md`** ——
 * `next.config.mjs` 里那条 rewrite 把它落到这里（App Router 的动态段必须独占一整段，
 * 没法直接建一个 `[slug].md` 目录）。改这两处要一起改。
 *
 * 为什么要有这个出口：生成式检索抓 HTML 时，正文外面裹着导航、云、袋鼠、目录、
 * 上一篇下一篇 —— 模型得先猜哪一段是文章。给一份干净的 Markdown，引用准确率的差别
 * 就在这里。文件头部带上出处、日期、作者（见 lib/content/markdown.ts）。
 */

export const dynamic = 'force-static'
/** 只产出已发布的那些，其余一律 404 —— 与 /[slug] 页面同一条规矩 */
export const dynamicParams = false

export async function generateStaticParams() {
  return getAllPostParams()
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const post = await getPost(slug)
  if (!post) return new Response('Not found\n', { status: 404 })

  return new Response(toMarkdownDocument(post, await readPostSource(post)), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  })
}
